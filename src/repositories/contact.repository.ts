import { getDb } from '../config/database'
import { Contact } from '../models/contact.model'

export class ContactRepository {

    async findByEmailOrPhone(
        email: string | null | undefined,
        phoneNumber: string | null | undefined

    ): Promise<Contact[]> {
        const db = await getDb()

        const conditions: string[] = []
        const values: string[] = []

        if (email) {
            conditions.push(`email = ?`)
            values.push(email)
        }
        if (phoneNumber) {
            conditions.push(`phoneNumber = ?`)
            values.push(phoneNumber)
        }

        if (conditions.length === 0) return [];

        const query = `
            SELECT * FROM CONTACT
            WHERE (${conditions.join(' OR ')})
            AND deletedAt IS NULL
            ORDER BY createdAt ASC
        `
        const rows = await db.all<Contact[]>(query, values)
        return rows
    }

    async findClusterByPrimaryId(primaryId: number): Promise<Contact[]> {
        const db = await getDb()

        const rows = await db.all<Contact[]>(
            `
                SELECT * FROM CONTACT 
                WHERE (id = ? OR linkedId = ?)
                AND deletedAt IS NULL
                ORDER BY createdAt ASC
            `, [primaryId, primaryId]
        )
        return rows
    }

    // create a new contact row, used for both primary and secondary contacts
    async createContact(data: {
        email: string | null
        phoneNumber: string | null
        linkedId: number | null
        linkPrecedence: 'primary' | 'secondary'
    }): Promise<Contact> {
        const db = await getDb()

        const result = await db.run(
            `
                INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [data.email, data.phoneNumber, data.linkedId, data.linkPrecedence]
        )
        const created = await db.get<Contact>(
            `SELECT * FROM Contact WHERE id = ?`,
            [result.lastID]
        )

        if (!created) {
            throw new Error('Failed to create contact')
        }
        return created;
    }


    async demoteToSecondary(id: number, newLinkedId: number): Promise<void> {
        const db = await getDb();

        await db.run(
            `UPDATE Contact
       SET linkedId = ?,
           linkPrecedence = 'secondary',
           updatedAt = datetime('now')
       WHERE id = ?`,
            [newLinkedId, id]
        );
    }
    async rebaseSecondaries(oldPrimaryId: number, newPrimaryId: number): Promise<void> {
        const db = await getDb();

        await db.run(
            `UPDATE Contact
       SET linkedId = ?,
           updatedAt = datetime('now')
       WHERE linkedId = ?
         AND deletedAt IS NULL`,
            [newPrimaryId, oldPrimaryId]
        );
    }
}