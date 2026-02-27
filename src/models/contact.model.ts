// exact structure of a row in the Contact table, mentioned 
export interface Contact {
    id: number
    phoneNumber: string | null
    email: string | null
    linkedId: number | null
    linkPrecedence : 'primary' | 'secondary'
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

// defining incoming post request, mentioned 
export interface IdentifyRequest {
    email?: string | null
    phoneNumber?: string | null
}

//defining response backend sends, mentioned 
export interface IdentifyResponse {
    contact: {
        primaryContactId: number
        emails: string[]
        phoneNumbers: string[]
        secondaryContactIds: number[]
    }
}

