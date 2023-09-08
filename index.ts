console.log('hello from deno!')

const handler = (request: Request): Response => {
    console.log(request)
    return new Response("hello from deno new!", { status : 200 })
}

Deno.serve(handler)