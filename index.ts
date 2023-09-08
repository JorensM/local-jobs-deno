import { Client, Databases, Query, Models } from 'npm:node-appwrite'

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
    console.log('3')
    if(!DB_ID || !COLLECTION_USERS_ID) {
        throw new Error('Missing env vars in addContactToUser()')
    }
    console.log('4')
    let user_docs = null;
    console.log(db)
    try {
        user_docs = await db.listDocuments<UserDocument>(
            DB_ID,
            COLLECTION_USERS_ID,
            [
                Query.equal('user_id', user_id)
            ]
        )
    } catch (err) {
        console.log('HHH')
        console.error('error')
        console.error(err)
    }
    
    console.log('5')
    if (user_docs!.total < 1) {
        //#TODO: Create a document for user if there isn't one created
        throw new Error('DB Document for user ' + user_id + ' not found')
    }

    const user_doc = user_docs!.documents[0]
    console.log('6')
    await db.updateDocument<UserDocument>(
        DB_ID,
        COLLECTION_USERS_ID,
        user_doc.$id,
        {
            contacts: [ ...user_doc.contacts, contact_id]
        }
    )
    console.log('7')
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
            console.log('1')
            try {
                await addContactToUser(contact_id, user_id, db)
            } catch (err) {
                console.log('2')
                console.error(err)
                return res({
                    success: false,
                    msg: err.message
                }, 400)
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