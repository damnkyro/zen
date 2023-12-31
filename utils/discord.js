const { createReadStream } = require('fs');
const { createInterface } = require('readline');
const { randomLocation } = require("./location");

function backTick(text){
    return "```" + text + "```";
}

async function randomSystemInfo() {
    const processors = [
        "13th Gen Intel® Core™ i7-13700H", "12th Gen Intel® Core™ i7-1250U", "12th Gen Intel® Core™ i7-12700H",
        "Intel(R) Core(TM) i3-5005U CPU", "AMD Ryzen 9 3900X", "AMD Ryzen 5 7600X", "AMD Ryzen 5 7500F",
        "Intel Core i5-1334U", "Intel Pentium Silver N5030"
    ];
    const gpu = [
        "Intel Iris Xe Graphics", "NVIDIA GeForce RTX 3050 Ti", "NVIDIA GeForce RTX 3070", "NVIDIA GeForce RTX 3070 Ti",
        "NVIDIA GeForce RTX 2080 Ti", "NVIDIA GeForce GTX 1650", "NVIDIA GeForce GTX 1650 Ti",
        "AMD Radeon RX 6600", "Intel Arc A580", "NVIDIA GeForce GTX 1660", "NVIDIA GeForce GTX 1660 Ti",
        "NVIDIA GeForce GT 1030", "AMD Radeon RX 580", "AMD Radeon RX 550"
    ];
    const ram = ["8GB", "12GB", "16GB", "32GB"];
    const storage = ["512GB", "256GB", "1TB"];

    const systemInfo = [processors, gpu, ram, storage];

    const [randomProcessor, randomGPU, randomRAM, randomStorage] = systemInfo.map(category => {
        const randomIndex = Math.floor(Math.random() * category.length);
        return category[randomIndex];
    });

    return {
        processor: randomProcessor,
        gpu: randomGPU,
        ram: randomRAM,
        storage: randomStorage
    }
};

async function generateToken(id) {
    const base64Id = btoa(id);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-_";

    const randomString = (length) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    return `${base64Id}.${randomString(6)}.${randomString(38)}`;
};


async function generateRandomID(){
    let randomDiscordID = '';
  
    for (let i = 0; i < 18; i++) {
      const digit = Math.floor(Math.random() * 10);
      randomDiscordID += digit.toString();
    }
  
    return randomDiscordID;
}

async function discordInformation(){
    const usernamePath = "./public/media/files/usernames.txt";
    const imagePath = "./public/media/files/images.txt";

    const filePaths = [usernamePath, imagePath];

    const randomLineFromFile = async (filePath) => {
        const lines= [];

        return new Promise((resolve) => {
            const readStream = createInterface({
                input: createReadStream(filePath)
            });

            readStream.on('line', (line) => {
                lines.push(line);
            });

            readStream.on('close', () => {
                if (lines.length !== 0){
                    const randomIndex = Math.floor(Math.random() * lines.length);
                    const randomValue = lines[randomIndex];
                    resolve(randomValue);
                } else {
                    resolve("Unknown");
                }
            });
        });
    };
    
    const id = await generateRandomID();
    const [username, image] = await Promise.all(filePaths.map(randomLineFromFile));
    const nitro = ["True", "False", "False"][Math.floor(Math.random() * 2)];
    const billing = ["True", "False", "False"][Math.floor(Math.random() * 2)];
    const token = await generateToken(id);

    return {
        username,
        image,
        id,
        token,
        nitro,
        billing,
    }
}

async function sendDiscordLogs(webhook){
    if (!webhook.startsWith("https://discord.com/api/webhooks")){
        return "This isnt a valid discord webhook";
    }

    const [discordInfo, systemInfo, locationInfo] = await Promise.all([
        discordInformation(), randomSystemInfo(), randomLocation(),
    ]);

    const { username, image, id, token, nitro, billing } = discordInfo;
    const { processor, gpu, ram, storage } = systemInfo;
    const { ip, timezone, isp, country } = locationInfo;
    
    const payload = {
        embeds: [
            {
                fields: [
                    {
                        name: ":key:  Token",
                        value: backTick(`${token}`),
                    },
                    {
                        name: ":computer:  System",
                        value: backTick(`CPU: ${processor}\nGPU: ${gpu}\nRAM: ${ram}\nStorage: ${storage}`),
                    },
                    {
                        name: ":map:  Location",
                        value: backTick(`IP: ${ip}\nTimezone: ${timezone}\nISP: ${isp}\nCountry: ${country}`),
                    },
                    {
                        name: ":open_file_folder:  Account Info",
                        value: backTick(`Username: ${username}\nDiscord ID: ${id}\nNitro: ${nitro}\nBilling: ${billing}`),
                    },
                ],
                title: `${username} (${id})`,
                thumbnail: {
                    url: image
                },
                description: `[Star the github page](https://github.com/damnkyro/zen)`,
                color: "10181046",
                footer: {
                    text : "made by kyro",
                    icon_url : "https://i.pinimg.com/564x/fd/27/bd/fd27bda8edcd40ef1f6f24cc469762ca.jpg",
                }
            },
        ],

        avatar_url: "https://i.pinimg.com/564x/be/5a/cb/be5acbff46be99e34153df575a97a91f.jpg",
        username: "Token Grabber"
    };
    
    try {
        const response = await fetch(webhook, {
            method : 'POST',
            headers: {
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify(payload),
        });
    
        if (response.ok){
            return "Fake discord credentials sent";
        }

        else if (response.status === 401){
            return "This webhook does not exist";
        }
    
        else if (response.status === 429){
            const data = await response.json();
            return `This webhook is being rate limited for ${parseFloat(data.retry_after)} seconds`;
        }
    
        else {
            console.error(`HTTP ${response.status}: ${await response.text()}`);
            return "An unknown error occurred"
        }
    }

    catch (error) {
        if (error instanceof TypeError){
            console.error("Your webhook is invalid: ", error.message);
        }
    }
}

module.exports = {
    sendDiscordLogs
}