import { Client, Databases, Query, Models } from 'npm:node-appwrite@^9.0.0'

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

function addContactToUser(
    contact_id: string, 
    user_id: string, 
    db: Databases
) {
    return new Promise((resolve) => {
        console.log('3')
        if(!DB_ID || !COLLECTION_USERS_ID) {
            throw new Error('Missing env vars in addContactToUser()')
        }
        console.log('4')
        console.log(user_id)
        console.log(contact_id)
        const promise = db.listDocuments<UserDocument>(
            DB_ID,
            COLLECTION_USERS_ID,
            [
                Query.equal('user_id', user_id)
            ]
        )
        console.log(promise)
        promise.then( user_docs => {
            console.log('a')
            if (user_docs.total < 1) {
                //#TODO: Create a document for user if there isn't one created
                throw new Error('DB Document for user ' + user_id + ' not found')
            }
            console.log('b')
            const user_doc = user_docs.documents[0]
            db.updateDocument<UserDocument>(
                DB_ID,
                COLLECTION_USERS_ID,
                user_doc.$id,
                {
                    contacts: [ ...user_doc.contacts, contact_id]
                }
            ).then(() => {
                console.log('c')
                resolve(true)
            })
        }).catch(err => {
            console.log('could not get user documents')
            console.error('could not get user documents')
            console.error(err)
        })
    })
}

function res<T = object | string | number>(data: T, status = 200){ 
    return new Response(JSON.stringify(data), { status })
}

const handler = (req: Request): Promise<Response> => {
    return new Promise((resolve) => {
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
                // let data = null

                req.json().then((data) => {
                    if( 
                        !data?.data?.object?.metadata || 
                        !hasKeys(data.data.object.metadata, ['contact_id', 'user_id'])
                    ) {
                        resolve( new Response(JSON.stringify({
                            success: false,
                            msg: 'Missing contact_id and user_id'
                        }), { status: 400 }) )
                    }
                    const { contact_id, user_id } = data.data.object.metadata
                    console.log('1')
                    addContactToUser(contact_id, user_id, db)
                    .then(() => {
                        resolve(res({
                            success: true,
                            msg: 'Contact has been added to user\'s contacts'
                        }))
                    }).catch( err => {
                        console.error(err)
                    })
                }).catch(err => {
                    resolve( new Response(JSON.stringify({
                        sucecss: false,
                        msg: err.message
                    })))
                })
                break
            }
            default: {
                resolve( new Response('404 Not found', { status: 404 }) )
            }
        }

    })
    
    //console.log(request)
    //return new Response("hello from deno new!", { status : 200 })
}

Deno.serve(handler)