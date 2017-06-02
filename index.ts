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
  Message,
  FriendRequest,
  log,
}           from 'wechaty'

import updateContactData from './tasks/updateContactData'
// import updateRoomData from './tasks/updateRoomData'

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
.on('friend', async function (contact: Contact, request: FriendRequest) {
  if(request){
      if(request.hello !== 'lalala'){
        console.log(`Request from ${contact.name()} : ${request.hello} , will not be accept automatic.`)
        return
      }

      let result = await request.accept()
      if(result){
          console.log(`Request from ${contact.name()} is accept succesfully!`)
          contact.say(`Hi~ 我是zoe的机器人 \n 回复 666 加入组织哟😘`)
      } else{
          console.log(`Request from ${contact.name()} failed to accept!`)
      }
  } else {
      console.log(`new friendship confirmed with ${contact.name()}`)
  }
})
.on('message', (message: Message) => {
  console.log(`message ${message} received`)
  // console.log(`message type ${message.type()}`)
  // console.log(`message type ${message.typeApp()}`)
  console.log(`message type ${message.getSenderString()}`)
  console.log(`message type ${message.getContentString()}`)
  if( message.content() === '666' ){
    message.say('welcome')
  }
})
.on('room-join', function(this, room, inviteeList, inviter) {
  log.info( 'Bot', 'EVENT: room-join - Room %s got new member %s, invited by %s',
            room.topic(),
            inviteeList.map(c => c.name()).join(','),
            inviter.name(),
          )
})
.on('room-leave', function(this, room, leaverList) {
  log.info('Bot', 'EVENT: room-leave - Room %s lost member %s',
                  room.topic(),
                  leaverList.map(c => c.name()).join(','),
              )
})
.on('room-topic', function(this, room, topic, oldTopic, changer) {
  try {
    log.info('Bot', 'EVENT: room-topic - Room %s change topic to %s by member %s',
                    oldTopic,
                    topic,
                    changer.name(),
                )
  } catch (e) {
    log.error('Bot', 'room-topic event exception: %s', e.stack)
  }
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
  // updateRoomData()
}