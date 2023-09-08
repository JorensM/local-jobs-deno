import { Client, Databases } from 'npm:node-appwrite'

const endpoint_url = {
    stripe_contact_payment_success: '/api/stripe-contact-payment-success'
}

if (
    !Deno.env.has('APPWRITE_ENDPOINT') || 
    !Deno.env.has('APPWRITE_API_KEY') ||
    !Deno.env.has('APPWRITE_PROJECT_ID')
) {
    throw new Error('Required ENV variables are not set')
}

function hasKeys(obj: object, keys: string[]): boolean {
    const obj_keys = Object.keys(obj)
    return keys.every(key => {
        return obj_keys.includes(key)
    })
}

function addContactToUser(contact_id: string, user_id: string) {

}

const handler = async (req: Request): Promise<Response> => {

    const client = new Client()

    client
        .setEndpoint(Deno.env.get('APPWRITE_ENDPOINT')!)
        .setKey(Deno.env.get('APPWRITE_API_KEY')!)
        .setProject(Deno.env.get('APPWRITE_PROJECT_ID')!)

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
            
            console.log(typeof data)
            console.log('data: ', data)

            if( 
                !data?.data?.object?.metadata || 
                hasKeys(data.data.object.metadata, ['contact_id', 'user_id'])
            ) {
                return new Response(JSON.stringify({
                    success: false,
                    msg: 'Missing contact_id and user_id'
                }), { status: 400 })
            }
            //const { contact_id, user_id } = req.body.
            //addContactToUser()
            return new Response('aaa')
            break
        }
        default: {
            return new Response('404 Not found', { status: 404 })
        }
    }

    //console.log(request)
    //return new Response("hello from deno new!", { status : 200 })
}

Deno.serve(handler)