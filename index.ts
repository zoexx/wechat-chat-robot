/**
 *
 * Wechaty - Wechat for Bot
 *
 * Connecting ChatBots
 * https://github.com/wechaty/wechaty
 *
 */

import { createWriteStream , writeFile } from 'fs'

/* tslint:disable:variable-name */
const QrcodeTerminal = require('qrcode-terminal')

/**
 * Change `import { ... } from '../'`
 * to     `import { ... } from 'wechaty'`
 * when you are runing with Docker or NPM instead of Git Source.
 */
import {
  Config,
  Contact,
  Wechaty,
  log,
}           from 'wechaty'

const welcome = `
Please wait... I'm trying to login in...
`

console.log(welcome)
const bot = Wechaty.instance({ profile: Config.DEFAULT_PROFILE })

bot
.on('login'	  , function(this, user) {
  log.info('Bot', `${user.name()} logined`)
  this.say('wechaty contact-bot just logined')

  /**
   * Main Contact Bot start from here
   */
  main()

})
.on('logout'	, user => log.info('Bot', `${user.name()} logouted`))
.on('error'   , e => log.info('Bot', 'error: %s', e))
.on('scan', (url, code) => {
  if (!/201|200/.test(String(code))) {
    const loginUrl = url.replace(/\/qrcode\//, '/l/')
    QrcodeTerminal.generate(loginUrl)
  }
  console.log(`${url}\n[${code}] Scan QR Code in above url to login: `)
})

bot.init()
.catch(e => {
  log.error('Bot', 'init() fail: %s', e)
  bot.quit()
  process.exit(-1)
})

/**
 * Main Bot
 */
async function main() {
  updateContactData()
}


/**
 * 更新/收集 通讯录数据
 * 
 */
async function updateContactData() {
  const contactList = await Contact.findAll()

  log.info('Bot', '#######################')
  log.info('Bot', 'Contact number: %d\n', contactList.length)
  log.info('Bot', 'I will save the contact info at ./data/contact.json')
  log.info('Bot', 'deal data ...')

  let contactDataList = [] ;

  for (let i = 0; i < contactList.length; i++) {
    const contact = contactList[i]

    if (!contact.weixin()) {
      await contact.refresh()
    }

    let contactData = {
      id : contact.id,
      weixin : contact.weixin(),
      name : contact.name(),
      isStranger : contact.stranger(),
      isStar : contact.star(),
      gender : contact.gender(),
      province : contact.province(),
      city : contact.city(),
      alias : contact.alias(),
      isOfficial : false ,
      isSpecial : false ,
      isPersonal : false ,
    }

    if (contact.official()) {
      log.info('Bot', `official ${i}: ${contact}`)
      contactData.isOfficial = true
    }
    if (contact.special()){
      log.info('Bot', `special ${i}: ${contact.name()}`)
      contactData.isSpecial = true
    }
    if (contact.personal()){
      log.info('Bot', `personal ${i}: ${contact.get('name')} : ${contact.id}`)
      contactData.isPersonal = true
    }

    contactDataList.push(contactData)
  }


  writeFile( './data/contact.json' , JSON.stringify( contactDataList ) , 'utf8' , function(err){
    if (err) throw err
    console.log('The file has been saved!')
  })

}