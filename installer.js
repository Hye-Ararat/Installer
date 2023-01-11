const prompts = require("prompts");
const { exec, execSync } = require("child_process");
const {NodeSSH} = require("node-ssh");

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
(async function setup() {
    const log = async (s) => {
        return new Promise(async (resolve, reject) => {
            for (const c of s) {
                process.stdout.write(c);
                await sleep(20);
            }
            await sleep(500);
            process.stdout.write('\n');
            resolve();
        });
    }
    await log("Hello! Thanks for choosing Hye Ararat!");
    await log("Hye Ararat will automatically be installed on your node through SSH using username/password authentication. Ubuntu is required.")

    const prerequesites = await prompts({
        type: "confirm",
        name: "value",
        message: "Do you have a node which meets these prerequesites at the ready?"
    })
    if (!prerequesites.value) return;
    await log("Great! Let's get started.");
    const ip = await prompts({
        type: "text",
        name: "value",
        message: "What is the SSH address of your node (do not include port)?"
    });
    const port = await prompts({
        type: "number",
        name: "value",
        message: "What is the SSH port of your node (default is 22)?"
    });
    const username = await prompts({
        type: "text",
        name: "value",
        message: "What is the SSH username?"
    });
    const password = await prompts({
        type: "password",
        name: "value",
        message: "What is the password to this node?"
    });
    await log("Connecting...")
    const ssh = new NodeSSH();
    let connection;
    try {
        connection = await ssh.connect({
            host: ip.value,
            port: port.value,
            username: username.value,
            password: password.value,
        });
    } catch {
        console.log("❌ I wasn't able to connect to your node. Please make sure the information is correct and try again.");
        process.exit(0);
    }
  
    await log("✅ Connection successful.")
    await log("Verifying Compatibility...")
    let osRelease = await connection.execCommand("cat /etc/os-release")
    if (!osRelease.stdout.includes("Ubuntu")) {
        console.log("❌ System is not compatible! Hye Ararat is only compatible with Ubuntu.");
        process.exit(0);
    }
    await log("✅ System OS is compatible.")
    let esc = false;
    function escalated() {
        return new Promise((resolve, reject) => {
            if (username.value == "root") {
                return resolve(true)
            }
            let interval = setInterval(() => {
                if (esc) {
                    clearInterval(interval);
                    return resolve(true)
                }
            }, 100)
        })
    }
    let curlDone1 = false;
    let curlDone = false;
    let nvmDone = false;
    let nodeDone = false;
    let araratCloned1 = false;
    let araratDone = false;
    let npmIDone1 = false;
    let npmIDone = false;
    let channel = await connection.requestShell();
        channel.on("data", async (d) => {
            //console.log(d.toString())
            if (d.toString().includes("password for")) {
                channel.write(password.value + "\n");
                esc = true;
            }
            if (d.toString().includes("not in the sudoers file")) {
                await log("❌ Could not escalate to superuser because " + username.value + " is not in the sudoers file.")
                process.exit(0)
            }
            if (d.toString().includes("curlDone")) {
                if (!curlDone1) {
                    curlDone1 = true;
                } else {
                    await log("✅ Dependencies curl git were installed successfully");
                    curlDone = true;
                }
            }
            if (d.toString().includes("This loads nvm bash_completion")) {
                nvmDone = true;
            }
            if (d.toString().includes("Now using node")) {
                nodeDone = true;
            }
            if (d.toString().includes("araratCloned") || d.toString().includes("fatal: destination path '.' already exists and is not an empty directory")) {
                if (!araratCloned1) {
                    araratCloned1 = true;
                } else {
                    araratDone = true;
                }
            }
            if (d.toString().includes("npmDone")) {
                if (!npmIDone1) {
                    npmIDone1 = true;
                } else {
                    npmIDone = true;
                }
            }
            if (d.toString().includes("You're node has been setup! You can now navigate to it using the URL you specified earlier in your web browser.")) {
                console.log("Hye Ararat has been successfully installed and configured! You can now navigate to it using the URL you specified earlier in your web browser.")
                process.exit(0)
            }
        })
        if (username.value != "root") {
            await log("Escalating to superuser...")
            channel.write("sudo su\n")
        }
        await escalated();
        await log("Installing dependency: curl git")
        function curlInstalled() {
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    if (curlDone) {
                        clearInterval(interval);
                        return resolve(true)
                    }
                }, 100)
            })
        }

        channel.write("apt-get install -y curl git && echo curlDone\n")
        await curlInstalled();

        await log("Installing Node.JS...")
        function nvmReady() {
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    if (nvmDone) {
                        clearInterval(interval);
                        return resolve(true)
                    }
                }, 100)
            })
        }

        channel.write("curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash\n");
        await nvmReady();
        channel.write('export NVM_DIR="$HOME/.nvm" \n [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm \n[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion\n')
        channel.write("nvm install --lts\n")
        function nodeReady() {
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    if (nodeDone) {
                        clearInterval(interval);
                        return resolve(true)
                    }
                }, 100)
            })
        }
        await nodeReady();
        await log(`✅ Node.JS has been successfully installed.`)
        await log(`Downloading Hye Ararat...`);
        channel.write(`mkdir usr/lib/ararat\n`)
        channel.write(`cd /usr/lib/ararat && git clone https://github.com/Hye-Ararat/Ararat.git . && echo araratCloned\n`);
        function araratReady() {
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    if (araratDone) {
                        clearInterval(interval);
                        return resolve(true)
                    }
                }, 100)
            })
        }
        await araratReady();
        await log(`✅ Hye Ararat has been downloaded`)
        await log(`Installing node modules...`)
        function npmReady() {
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    if (npmIDone) {
                        clearInterval(interval);
                        return resolve(true)
                    }
                }, 100)
            })
        }
        channel.write(`npm install && npm link && echo npmDone\n`)
        await npmReady();
        await log(`✅ Node modules installed!`)
        await log(`Initiating node setup...`)
        channel.write("ararat setupnode\n");
        channel.stdout.pipe(process.stdout)
        process.stdin.pipe(channel.stdin)
}());