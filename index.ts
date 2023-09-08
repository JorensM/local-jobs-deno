const endpoint_url = {
    stripe_contact_payment_success: 'api/stripe_contact_payment_success'
}

const handler = (request: Request): Response => {

    const pathname = new URL(request.url).pathname

    console.log(pathname)

    switch(pathname) {
        case endpoint_url.stripe_contact_payment_success: {
            return new Response('payment success!')
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