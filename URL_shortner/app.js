import { readFile } from "fs/promises";
import { createServer } from "http";
import crypto from "crypto"
import path from "path"
import { writeFile } from "fs/promises";
// import { fileURLToPath } from "url";


const PORT = 10000;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname;
const __dirname = process.cwd()   //current working directory
// const DATA_FILE = path.join(__dirname,"data","links.json")
const data_path = __dirname + "/URL_shortner" + "/url" + "/Data" + "/data.json";
// console.log(DATA_FILE)
console.log(__dirname)
const serveFile = async (res, filePath, contentType) => {
    // console.log(filePath)        // for accessing the path
    try {
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 - Page not found");
    }
};
const loadlinks=async()=>{
    try{
        const data = await readFile(data_path,"utf-8")
        if (!data) {
            console.error("Error: No data to parse");
            return {};
        }
        return JSON.parse(data);
        
        // return JSON.parse(data);

    }
    catch(error){
        if(error.code === "ENOENT"){
            await writeFile(data_path,JSON.stringify({}));
            return {};
        }
        throw error;
    }

}

const saveLinks = async(links)=>{
    await writeFile(data_path,JSON.stringify(links))
    console.log(saveLinks)

}
const server = createServer(async (req, res) => {
    console.log("req" ,req.url);
    
    if (req.method === "GET") {
        if (req.url === "/") {
            return serveFile(res, path.join(__dirname,"URL_shortner/url/public", "index.html"), "text/html");

        } 
        else if (req.url === "/style.css") {
            return serveFile(res, path.join(__dirname,"URL_shortner/url/public", "style.css"), "text/css");
        }
        else if(req.url==="/links"){
            const links = await loadlinks();
            res.writeHead(200,{"Content-Type":"application/json"})
            res.end(JSON.stringify(links))

        }
        else{
            const links = await loadlinks();
            const shortcode = req.url.slice(1);
            console.log("links red. ",req.url);
            if(links[shortcode]){
                res.writeHead(302,{location:links[shortcode]})
                return res.end()
            }
            res.writeHead(404,{"Content-Type":"text/plain"})
                return res.end("shortened URL is not found")

        }
    }
    // POST method

    if(req.method === "POST" && req.url === "/shorten"){

        const links = await loadlinks();
        let body ="";
        req.on("data",(chunk)=>{
            body += chunk;
        });
        req.on('end',async()=>{
            console.log(body);
            const {url,shortcode} = JSON.parse(body);

            if(!url){
                res.writeHead(400,{"Content-Type":"text/plain"})
                return res.end("URL is required")
            }
            const finalshortcode = shortcode || crypto.randomBytes(4).toString("hex")

            if(links[finalshortcode]){
                res.writeHead(400,{"Content-Type":"text/plain"})
                return res.end("Short Code akready exist. PLease choose another")
            }
            links[finalshortcode] = url;
            await saveLinks(links);
            res.writeHead(200,{"Content-Type":"application/json"})
            res.end(JSON.stringify({success:true,shortcode:finalshortcode}))

        })
    }

    
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
