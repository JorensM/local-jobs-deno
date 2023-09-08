import { Client, Databases, Query, Models } from 'https://deno.land/x/appwrite@9.0.0/mod.ts'

const endpoint_url = {
    stripe_contact_payment_success: '/api/stripe-contact-payment-success'
}

function check_env_vars(keys: string[]){
    for (const key of keys) {
        if (!Deno.env.has(key)) {
            return false
        }   
    }
    return true
}

if (
    !Deno.env.has('APPWRITE_ENDPOINT') || 
    !Deno.env.has('APPWRITE_API_KEY') ||
    !Deno.env.has('APPWRITE_PROJECT_ID')
) {
    throw new Error('Required ENV variables are not set')
}

if(!check_env_vars([
    'DB_ID',
    'COLLECTION_USERS_ID',
])) {
    console.warn('Recommended ENV vars not set, some functionality may not work')
}

const DB_ID = Deno.env.get('DB_ID')
const COLLECTION_USERS_ID = Deno.env.get('COLLECTION_USERS_ID')

function hasKeys(obj: object, keys: string[]): boolean {
    const obj_keys = Object.keys(obj)
    return keys.every(key => {
        return obj_keys.includes(key)
    })
}

type UserDocument = Models.Document & {
    user_id: string,
    contacts: string[]
    role: 'recruiter' | 'performer'
}

async function addContactToUser(
    contact_id: string, 
    user_id: string, 
    db: Databases
) {
    if(!DB_ID || !COLLECTION_USERS_ID) {
        throw new Error('Missing env vars in addContactToUser()')
    }
    const user_docs = await db.listDocuments<UserDocument>(
        DB_ID,
        COLLECTION_USERS_ID,
        [
            Query.equal('user_id', user_id)
        ]
    )

    if (user_docs.total < 1) {
        //#TODO: Create a document for user if there isn't one created
        throw new Error('DB Document for user ' + user_id + ' not found')
    }

    const user_doc = user_docs.documents[0]

    await db.updateDocument<UserDocument>(
        DB_ID,
        COLLECTION_USERS_ID,
        user_doc.$id,
        {
            contacts: [ ...user_doc.contacts, contact_id]
        }
    )

    return true
}

function res<T = object | string | number>(data: T, status = 200){ 
    return new Response(JSON.stringify(data), { status })
}

const handler = async (req: Request): Promise<Response> => {

    const client = new Client()

    client
        .setEndpoint(Deno.env.get('APPWRITE_ENDPOINT')!)
        .setKey(Deno.env.get('APPWRITE_API_KEY')!)
        .setProject(Deno.env.get('APPWRITE_PROJECT_ID')!)

    const db = new Databases(client)

    const pathname = new URL(req.url).pathname

    console.log('HTTP request at ' + pathname)

    switch(pathname) {
        case endpoint_url.stripe_contact_payment_success: {
            let data = null
            try {
                data = await req.json()
            } catch (err) {
                return new Response(JSON.stringify({
                    sucess: false,
                    msg: err.message
                }))
            }

            if( 
                !data?.data?.object?.metadata || 
                !hasKeys(data.data.object.metadata, ['contact_id', 'user_id'])
            ) {
                return new Response(JSON.stringify({
                    success: false,
                    msg: 'Missing contact_id and user_id'
                }), { status: 400 })
            }
            const { contact_id, user_id } = data.data.object.metadata
            try {
                await addContactToUser(contact_id, user_id, db)
            } catch (err) {
                console.error(err)
                return res({
                    success: false,
                    msg: err.message
                })
            }
            
            return res({
                success: true,
                msg: 'Contact added to user\'s contacts list'
            })
        }
        default: {
            return new Response('404 Not found', { status: 404 })
        }
    }

    //console.log(request)
    //return new Response("hello from deno new!", { status : 200 })
}

Deno.serve(handler)