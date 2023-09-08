import { serve } from 'https://deno.land/std@0.201.0/http/server.ts'

const port = 8080

console.log('hello from deno!')

const handler = (request: Request): Response => {
    console.log(request)
    return new Response("hello from deno!", { status : 200 })
}

await serve(handler, { port })