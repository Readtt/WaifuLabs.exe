require('v8-compile-cache');
const {
    app,
    BrowserWindow,
    Menu,
    shell,
    dialog,
    Tray
} = require('electron')
const waifulabs = require('waifulabs')
const Alert = require('electron-alert')
const fs = require('fs')
const {
    JsonDB
} = require('node-json-db')
const {
    Config
} = require('node-json-db/dist/lib/JsonDBConfig')

process.env.NODE_ENV = 'production';

let db = new JsonDB(new Config('config', true, false, '/'))
const pie = require('puppeteer-in-electron')

async function init() {
    await pie.initialize(app)
}
init()

const puppeteer = require('puppeteer-core')

async function createWindow() {
    const browser = await pie.connect(app, puppeteer)

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: __dirname + '/assets/favicon.ico',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
        },
    })

    win.maximize()
    let loading = await Menu.buildFromTemplate([{
        label: 'Loading...'
    }])
    await Menu.setApplicationMenu(loading)

    await win.loadURL('https://waifulabs.com/')
    const page = await pie.getPage(browser, win)

    await page.addStyleTag({
        content: '::-webkit-scrollbar {width: 10px;}'
    })
    await page.addStyleTag({
        content: '::-webkit-scrollbar-thumb {background: #b2b2b2; border-radius: 20px;}'
    })
    await page.addStyleTag({
        content: '::-webkit-scrollbar-track {background: #ddd; border-radius: 20px;}'
    })

    await page.evaluate(() => {
        localStorage.setItem('tutorial_done', true)
    })

    if (await dbExists('/count') == true) {
        let curCount = db.getData('/count/value')
        await db.push('/count', {
            value: curCount += 1
        })
    }

    if (await dbExists('/count') == false) {
        await db.push('/count', {
            value: 1
        })
    }

    if (await dbExists('/errors') == false) {
        await db.push('/errors', {
            randomWaifuErr: null
        })
    }

    if (db.getData('/count/value') == 1) {
        let a1 = new Alert();
        a1.fireFrameless({
            title: 'Do you want to try the tutorial?',
            type: 'success',
            text: 'This is your first time opening this app, do you want to try the tutorial?',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            closeOnConfirm: false,
        }).then(async (result) => {
            if (result.value) {
                await page.evaluate(() => {
                    localStorage.removeItem('tutorial_done')
                })
            }
        })
    }

    let randomized = false;

    let menu = await Menu.buildFromTemplate([{
            label: 'General',
            submenu: [{
                    label: 'Random Waifu',
                    async click() {
                        randomWaifu()
                    },
                    accelerator: 'Ctrl+Shift+R'
                },
                {
                    label: 'Valid Seed',
                    async click() {
                        validSeed()
                    },
                    accelerator: 'Alt+Shift+V'
                },
                {
                    label: 'Config',
                    async click() {
                        configMenu()
                    },
                    accelerator: 'Alt+Shift+C'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Open Console',
                    async click() {
                        let b2 = new Alert();
                        b2.fireFrameless({
                            title: 'Error',
                            type: 'error',
                            text: 'Debugging console coming soon.',
                            footer: 'In the meantime you can get yourself a cute waifu!',
                        })
                    },
                    accelerator: 'Ctrl+Shift+C'
                },
                {
                    label: 'Quit',
                    click() {
                        app.quit()
                    },
                    accelerator: 'Ctrl+Shift+Q'
                }
            ],
        },
        {
            label: 'Downloads',
            submenu: [{
                    label: 'Download Random',
                    async click() {
                        downloadRandom()
                    },
                    accelerator: 'Alt+Shift+D'
                },
                {
                    label: 'Download Seed',
                    click() {
                        downloadSeed()
                    },
                    accelerator: 'Alt+Shift+S'
                }
            ]
        },
        {
            label: 'Stats',
            submenu: [{
                label: 'Get Seeds',
                async click() {
                    getSeeds()
                },
                accelerator: 'Alt+Shift+G'
            }]
        },
        {
            label: 'Socials',
            submenu: [{
                    label: 'Become a Patron',
                    click() {
                        shell.openExternal('https://www.patreon.com/bePatron?u=23037728')
                    },
                    accelerator: 'Ctrl+Shift+P'
                },
                {
                    label: 'Support us on Ko-fi',
                    click() {
                        shell.openExternal('https://ko-fi.com/sizigi')
                    },
                    accelerator: 'Ctrl+Shift+K'
                },
            ]
        },
    ])

    await Menu.setApplicationMenu(menu)

    const contextMenu = require('electron-context-menu')
    contextMenu({
        showSaveImageAs: true,
        showCopyImage: true,
        showCopyImageAddress: true,

        showInspectElement: true,
    });

    await win.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        shell.openExternal(url);
    })

    async function validSeed() {
        let c3 = new Alert();
        await c3.fireFrameless({
            title: 'Check Seed',
            text: 'Check if your seed is valid',
            input: 'text',
            inputPlaceholder: 'Seed',
            showCancelButton: true,
        }).then(async (result) => {
            let seed = result.value

            try {
                await JSON.parse(seed)
            } catch {
                let d4 = new Alert();
                d4.fireFrameless({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Invalid waifu seed!'
                }, "Error", null, false)
                return;
            }

            let seeds = await JSON.parse(seed)

            const isValid = await waifulabs.isValidSeed(seeds)
            if (isValid == true) {
                let e5 = new Alert();
                e5.fireFrameless({
                    type: 'success',
                    title: 'Success',
                    text: `Valid waifu seed!`
                }, "Success", null, false)
                return;
            } else {
                let f6 = new Alert();
                f6.fireFrameless({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Invalid waifu seed!'
                }, "Error", null, false)
                return;
            }
        })
    }

    async function configMenu() {
        let g7 = new Alert();
        g7.fireFrameless({
            title: 'Error',
            type: 'error',
            text: 'Config editing coming soon.',
            footer: 'In the meantime you can make yourself a waifu!'
        })
    }

    async function getSeeds() {
        let waifuData = await page.evaluate(() => {
            if (!localStorage.getItem("waifu")) {
                return false;
            } else {
                return localStorage.getItem("waifu")
            }
        })

        if (waifuData == false) {
            let h8 = new Alert();
            h8.fireFrameless({
                type: 'warning',
                title: 'Oops...',
                text: `Please fully complete waifu generation before getting the seed.`,
                footer: 'To generate a random waifu, you can go to -> General -> Random Waifu'
            })
        } else {
            let i9 = new Alert();
            i9.fireFrameless({
                type: 'success',
                title: 'Seed',
                html: `<b>${JSON.stringify(JSON.parse(waifuData).seeds)}</b>`,
                footer: 'You can regenerate this waifu anytime by going to -> Downloads -> Download Seed and inputting this seed.'
            })
        }
    }

    async function downloadRandom() {
        let j10 = new Alert();
        const {
            value: ops
        } = await j10.fireFrameless({
            input: 'select',
            inputOptions: {
                Default: 'Default',
                Big: 'Big',
                Product: 'Product'
            },
            inputPlaceholder: 'Select a type',
            showCancelButton: true,
        })

        if (ops == undefined) {
            return;
        }

        let prods;

        if (ops == 'Product') {
            let k11 = new Alert();
            let randomProd = await k11.fireFrameless({
                title: 'Which Product?',
                input: 'select',
                inputOptions: {
                    Pillow: 'Pillow',
                    Poster: 'Poster'
                },
                inputPlaceholder: 'Pillow or Poster?',
                showCancelButton: true
            })

            prods = randomProd.value;

            if (prods == undefined) {
                return;
            }
        }

        let data;

        const waifus = await waifulabs.generateWaifus();
        const waifu = waifus[0]

        if (ops == 'Default') {
            data = await waifu;
        } else if (ops == 'Big') {
            data = await waifulabs.generateBigWaifu(waifu)
        } else if (ops == 'Product') {
            if (prods == 'Pillow') {
                data = await waifulabs.generateProduct(waifu, "PILLOW")
            } else if (prods == 'Poster') {
                data = await waifulabs.generateProduct(waifu, "POSTER")
            }
        }

        let imageData = data.image;
        let image = Buffer.from(imageData, 'base64')

        dialog.showSaveDialog({
            title: 'Save Waifu',
            buttonLabel: 'Save',
            filters: [{
                    name: 'Images',
                    extensions: ['png']
                },
                {
                    name: 'All Files',
                    extensions: ['*']
                }
            ]
        }).then((data) => {
            fs.writeFileSync(data.filePath, image, (err) => {
                if (err) {
                    let l12 = new Alert();
                    l12.fireFrameless({
                        type: 'error',
                        title: 'Oops...',
                        text: `Error saving waifu to ${data.filePath}`,
                        footer: err
                    })
                }
            })
            let m13 = new Alert();
            m13.fireFrameless({
                type: 'success',
                title: 'Success',
                text: `Waifu saved to ${data.filePath}`
            })
        }).catch(() => {
            return;
        })
    }

    async function downloadSeed() {
        let n14 = new Alert();
        const {
            value: accept
        } = await n14.fireFrameless({
            title: 'Product?',
            input: 'checkbox',
            inputPlaceholder: 'Do you want to download your seed as a product?',
            confirmButtonText: 'Continue&nbsp;<i class="fa fa-arrow-right"></i>',
            showCancelButton: true
        })

        if (accept == undefined) {
            return;
        }

        let prod;

        if (accept == 1) {
            let o15 = new Alert();
            let pp2 = await o15.fireFrameless({
                title: 'Which Product?',
                input: 'select',
                inputOptions: {
                    Pillow: 'Pillow',
                    Poster: 'Poster'
                },
                inputPlaceholder: 'Pillow or Poster?',
                showCancelButton: true
            })
            prod = pp2.value

            if (prod == undefined) {
                return;
            }
        }
        let p16 = new Alert();
        let promise = p16.fireFrameless({
            title: "Waifu Seed",
            text: "Download a waifu with a specific seed.",
            input: 'text',
            inputPlaceholder: 'Seed',
            showCancelButton: true,
            footer: 'Array of seeds (has to be numbers)',
        }, "Seed", null, false);
        promise.then(async (result) => {
            if (!result.dismiss) {
                let seed = await result.value
                let splitted = await seed

                try {
                    await JSON.parse(splitted)
                } catch {
                    q17.fireFrameless({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Invalid waifu seed!'
                    }, "Error", null, false)
                    return;
                }

                let seeds = await JSON.parse(splitted)
                const isValid = await waifulabs.isValidSeed(seeds)
                if (isValid == false) {
                    r18.fireFrameless({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Invalid waifu seed!'
                    }, "Error", null, false)
                } else {
                    let waifu;
                    if (accept == 1) {
                        if (prod == 'Pillow') {
                            waifu = await waifulabs.generateProduct(seeds, "PILLOW")
                        } else if (prod == 'Poster') {
                            waifu = await waifulabs.generateProduct(seeds, "POSTER")
                        }
                    } else {
                        waifu = await waifulabs.generateBigWaifu(seeds);
                    }
                    const imageData = waifu.image;
                    const image = Buffer.from(imageData, 'base64');

                    dialog.showSaveDialog({
                        title: 'Save Waifu',
                        buttonLabel: 'Save',
                        filters: [{
                                name: 'Images',
                                extensions: ['png']
                            },
                            {
                                name: 'All Files',
                                extensions: ['*']
                            }
                        ]
                    }).then((data) => {
                        fs.writeFileSync(data.filePath, image, (err) => {
                            if (err) {
                                let s19 = new Alert();
                                s19.fireFrameless({
                                    type: 'error',
                                    title: 'Oops...',
                                    text: `Error saving waifu to ${data.filePath}`,
                                    footer: err
                                })
                            }
                        })
                        let t20 = new Alert();
                        t20.fireFrameless({
                            type: 'success',
                            title: 'Success',
                            text: `Waifu saved to ${data.filePath}`
                        })
                    }).catch(() => {
                        return;
                    })
                }
            }
        })
    }

    async function randomWaifu() {
        if (randomized == false) {
            await randomized == true

            let randStepI = Math.floor(Math.random() * 15) + 1
            let randStepII = Math.floor(Math.random() * 15) + 1
            let randStepIII = Math.floor(Math.random() * 15) + 1
            let randStepIIII = Math.floor(Math.random() * 15) + 1

            try {
                for (let i = 0; i < 4; i++) {
                    await page.waitForSelector(`#root > div > div > div.ant-steps.ant-steps-horizontal.steps.ant-steps-label-vertical.ant-steps-dot > div:nth-child(${i + 1})`, {
                        timeout: 500
                    })
                }
                let stepI = await page.$eval('#root > div > div > div.ant-steps.ant-steps-horizontal.steps.ant-steps-label-vertical.ant-steps-dot > div:nth-child(1)', e => e.getAttribute('class'))
                let stepII = await page.$eval('#root > div > div > div.ant-steps.ant-steps-horizontal.steps.ant-steps-label-vertical.ant-steps-dot > div:nth-child(2)', e => e.getAttribute('class'))
                let stepIII = await page.$eval('#root > div > div > div.ant-steps.ant-steps-horizontal.steps.ant-steps-label-vertical.ant-steps-dot > div:nth-child(3)', e => e.getAttribute('class'))
                let stepIIII = await page.$eval('#root > div > div > div.ant-steps.ant-steps-horizontal.steps.ant-steps-label-vertical.ant-steps-dot > div:nth-child(4)', e => e.getAttribute('class'))

                async function step1() {
                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div > div > div:nth-child(${randStepI}) > div > div > div:nth-child(2) > div`)
                }

                async function step2() {
                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepII})`)
                }

                async function step3() {
                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepIII})`)
                }

                async function step4() {
                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepIIII})`)
                }

                if (stepI == 'ant-steps-item ant-steps-item-process') {

                    await step1()
                    await step2()
                    await step3()
                    await step4()

                } else if (stepII == 'ant-steps-item ant-steps-item-process') {

                    await step2()
                    await step3()
                    await step4()

                } else if (stepIII == 'ant-steps-item ant-steps-item-process') {

                    await step3()
                    await step4()

                } else if (stepIIII == 'ant-steps-item ant-steps-item-process') {

                    await step4()

                }

            } catch {
                try {
                    await page.waitForSelector('#introit > div.intro-container > div > a.button.block.blue', {
                        timeout: 500
                    })

                    let startup = await page.$$('.button-content')
                    await startup[0].click()

                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div > div > div:nth-child(${randStepI}) > div > div > div:nth-child(2) > div`)

                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepII})`)

                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepIII})`)

                    await page.waitForSelector('.girl')
                    await page.waitForTimeout(3000)
                    await page.waitForTimeout(1000)
                    await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepIIII})`)

                } catch {
                    try {
                        await page.waitForSelector('#root > div > div > div.girl-container > div > div.restart-button > button', {
                            timeout: 1000
                        })

                        await page.click('#root > div > div > div.girl-container > div > div.restart-button > button')

                        await page.waitForSelector('.girl')
                        await page.waitForTimeout(3000)
                        await page.waitForTimeout(1000)
                        await page.click(`#root > div > div > div.container > div > div > div:nth-child(${randStepI}) > div > div > div:nth-child(2) > div`)

                        await page.waitForSelector('.girl')
                        await page.waitForTimeout(3000)
                        await page.waitForTimeout(1000)
                        await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepII})`)

                        await page.waitForSelector('.girl')
                        await page.waitForTimeout(3000)
                        await page.waitForTimeout(1000)
                        await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepIII})`)

                        await page.waitForSelector('.girl')
                        await page.waitForTimeout(3000)
                        await page.waitForTimeout(1000)
                        await page.click(`#root > div > div > div.container > div.stacked > div > div:nth-child(${randStepIIII})`)
                    } catch {
                        if (await dbExists('/errors/randomWaifuErr') == true && db.getData('/errors/randomWaifuErr') == false) {} else {
                            let res = await dialog.showMessageBox(win, {
                                type: 'error',
                                title: 'Error',
                                message: `${err}\n\nDO NOT CLICK ANYTHING WHILE WAIFU IS GETTING CREATED!`,
                                buttons: ["Yes", "No", "Close"],
                                checkboxLabel: 'Check to not get these types of errors again.',
                                checkboxChecked: false
                            })
                            if (res.response == 1) {
                                return;
                            }
                            if (res.response == 0 && res.checkboxChecked == true) {
                                db.push("/errors", {
                                    randomWaifuErr: false
                                })
                            }
                        }
                    }
                }
            }
            let u21 = new Alert();
            await u21.fireFrameless({
                type: 'success',
                title: 'Success',
                text: `Random waifu finished.`
            })
            await randomized == false
        } else {
            return;
        }
    }

    async function dbExists(dbPath) {
        try {
            db.getData(dbPath)
            return true;
        } catch {
            return false;
        }
    }
}

app.whenReady().then(createWindow).then(() => {
    const path = require('path')
    let tray = new Tray(path.join('assets', 'favicon.ico'))
    const trayMenu = Menu.buildFromTemplate([{
        label: 'Quit',
        type: "checkbox",
        click() {
            app.quit()
        }
    }])

    tray.setContextMenu(trayMenu)
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})