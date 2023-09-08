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

function addContactToUser(contact_id: string, user_id: string) {

}

const handler = (req: Request): Response => {

    const client = new Client()

    client
        .setEndpoint(Deno.env.get('APPWRITE_ENDPOINT')!)
        .setKey(Deno.env.get('APPWRITE_API_KEY')!)
        .setProject(Deno.env.get('APPWRITE_PROJECT_ID')!)

    const pathname = new URL(req.url).pathname

    console.log('HTTP request at ' + pathname)

    switch(pathname) {
        case endpoint_url.stripe_contact_payment_success: {
            //const { contact_id, user_id } = req.body.
            //addContactToUser()
            return new Response(typeof req.body)
            //break
        }
        default: {
            return new Response('404 Not found', { status: 404 })
        }
    }

    //console.log(request)
    //return new Response("hello from deno new!", { status : 200 })
}

Deno.serve(handler)