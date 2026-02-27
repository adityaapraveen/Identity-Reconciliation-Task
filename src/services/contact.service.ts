import { ContactRepository } from '../repositories/contact.repository';
import { Contact, IdentifyRequest, IdentifyResponse } from '../models/contact.model';

export class ContactService {
    private repo: ContactRepository;

    constructor() {
        this.repo = new ContactRepository()
    }
    async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
        const { email, phoneNumber } = request

        //first find all contacts that directly match the incoming email | phoneNumber
        const directMatches = await this.repo.findByEmailOrPhone(email, phoneNumber)

        //if no matches at all then its a new customer so create a primary contact for this customer
        if (directMatches.length === 0) {
            const newContact = await this.repo.createContact({
                email: email ?? null,
                phoneNumber: phoneNumber ?? null,
                linkedId: null,
                linkPrecedence: 'primary'
            })
            return this.buildResponse([newContact])
        }

        //resolving primary id for every matched contact
        const primaryIds = new Set<number>()

        for (const contact of directMatches) {
            if (contact.linkPrecedence === 'primary') {
                primaryIds.add(contact.id)
            } else {
                primaryIds.add(contact.linkedId!)
            }
        }

        //fetch full cluster for every primary id found
        const allContacts: Contact[] = []

        for (const primaryId of primaryIds) {
            const cluster = await this.repo.findClusterByPrimaryId(primaryId)
            allContacts.push(...cluster)
        }

        //frmo all contacts fetched find the primaries
        const primaries = allContacts.filter(c => c.linkPrecedence === 'primary').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        const truePrimary = primaries[0]

        //merge scenario
        if (primaries.length > 1) {
            for (let i = 1; i < primaries.length; i++) {
                const demoted = primaries[i]
                await this.repo.rebaseSecondaries(demoted.id, truePrimary.id)
                await this.repo.demoteToSecondary(demoted.id, truePrimary.id)
            }
        }

        //fetch the clusted again after a merge
        const mergedCluster = await this.repo.findClusterByPrimaryId(truePrimary.id)

        //check if incoming request contains any new info
        const existingEmails = new Set(
            mergedCluster.map(c => c.email).filter(Boolean)
        )
        const existingPhones = new Set(
            mergedCluster.map(c => c.phoneNumber).filter(Boolean)
        )
        const hasNewEmail = email && !existingEmails.has(email)
        const hasNewPhone = phoneNumber && !existingPhones.has(String(phoneNumber))

        if (hasNewEmail || hasNewPhone) {
            await this.repo.createContact({
                email: email ?? null,
                phoneNumber: phoneNumber ? String(phoneNumber) : null,
                linkedId: truePrimary.id,
                linkPrecedence: 'secondary'
            })
            const updatedCluster = await this.repo.findClusterByPrimaryId(truePrimary.id)
            return this.buildResponse(updatedCluster)
        }

        return this.buildResponse(mergedCluster)

    }
    private buildResponse(contacts: Contact[]): IdentifyResponse {
        const primary = contacts.find(c => c.linkPrecedence === 'primary')!;
        const secondaries = contacts.filter(c => c.linkPrecedence === 'secondary');

        // Primary's email and phone must always come first in the arrays
        const emails: string[] = [
            ...(primary.email ? [primary.email] : []),
            ...secondaries
                .map(c => c.email)
                .filter((e): e is string => e !== null && e !== undefined),
        ];

        const phoneNumbers: string[] = [
            ...(primary.phoneNumber ? [primary.phoneNumber] : []),
            ...secondaries
                .map(c => c.phoneNumber)
                .filter((p): p is string => p !== null && p !== undefined),
        ];

        return {
            contact: {
                primaryContactId: primary.id,
                // Deduplicate while preserving order
                // e.g. if primary and secondary share the same phone, show it once
                emails: [...new Set(emails)],
                phoneNumbers: [...new Set(phoneNumbers)],
                secondaryContactIds: secondaries.map(c => c.id),
            },
        };
    }

}