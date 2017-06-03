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
  Room,
  FriendRequest,
  log,
}           from 'wechaty'

import updateContactData from './tasks/updateContactData'
// import updateRoomData from './tasks/updateRoomData'

const welcome = `
Please wait... I'm trying to login in...
`

const HELPER_CONTACT_NAME = '素素素素素'

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
          setTimeout(function() {
            contact.say(`Hi~ 我是zoe的机器人 \n 回复 666 加入组织哟😘`)
          }, 1000);
      } else{
          console.log(`Request from ${contact.name()} failed to accept!`)
      }
  } else {
      console.log(`new friendship confirmed with ${contact.name()}`)
  }
})
.on('message', function (this, message) {
  const room    = message.room()
  const sender  = message.from()
  const content = message.content()

  console.log((room ? '[' + room.topic() + ']' : '')
              + '<' + sender.name() + '>'
              + ':' + message.toStringDigest(),
  )

  if (message.self()) {
    return
  }
  /**
   * `ding` will be the magic(toggle) word:
   *  1. say ding first time, will got a room invitation
   *  2. say ding in room, will be removed out
   */
  if (/^666$/i.test(content)) {

    /**
     *  in-room message
     */
    if (room) {
      if (/^666/i.test(room.topic())) {
        /**
         * move contact out of room
         */
        getOutRoom(sender, room)
      }

    /**
     * peer to peer message
     */
    } else {

      /**
       * find room name start with "666"
       */
      Room.find({ topic: /^666/i })
          .then(dingRoom => {

            /**
             * room found
             */
            if (dingRoom) {
              log.info('Bot', 'onMessage: got dingRoom: %s', dingRoom.topic())

              /**
               * speaker is already in room
               */
              if (dingRoom.has(sender)) {
                log.info('Bot', 'onMessage: sender has already in')
                sender.say('no need to 666 again, because you are already in the room')

              /**
               * put speaker into room
               */
              } else {
                log.info('Bot', 'onMessage: add sender(%s) to dingRoom(%s)', sender.name(), dingRoom.topic())
                sender.say('ok, I will put you in 666 room!')
                putInRoom(sender, dingRoom)
              }

            /**
             * room not found
             */
            } else {
              log.info('Bot', 'onMessage: dingRoom not found, try to create one')
              sender.say('666 room was dissolved!')
            }
          })
          .catch(e => {
            log.error(e)
          })
    }
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


function putInRoom(contact, room) {
  log.info('Bot', 'putInRoom(%s, %s)', contact.name(), room.topic())

  try {
    room.add(contact)
        .catch(e => {
          log.error('Bot', 'room.add() exception: %s', e.stack)
        })
    setTimeout(_ => room.say('Welcome ', contact), 1000)
  } catch (e) {
    log.error('Bot', 'putInRoom() exception: ' + e.stack)
  }
}

function getOutRoom(contact: Contact, room: Room) {
  log.info('Bot', 'getOutRoom(%s, %s)', contact, room)

  try {
    room.say('You said "666" in my room, I will remove you out.')
    room.del(contact)
  } catch (e) {
    log.error('Bot', 'getOutRoom() exception: ' + e.stack)
  }
}

function getHelperContact() {
  log.info('Bot', 'getHelperContact()')

  // create a new room at least need 3 contacts
  return Contact.find({ name: HELPER_CONTACT_NAME })
}

async function createDingRoom(contact): Promise<any> {
  log.info('Bot', 'createDingRoom(%s)', contact)

  try {
    const helperContact = await getHelperContact()

    if (!helperContact) {
      log.warn('Bot', 'getHelperContact() found nobody')
      return
    }

    log.info('Bot', 'getHelperContact() ok. got: %s', helperContact.name())

    const contactList = [contact, helperContact]
    log.verbose('Bot', 'contactList: %s', contactList.join(','))

    const room = await Room.create(contactList, 'ding')
    log.info('Bot', 'createDingRoom() new ding room created: %s', room)

    room.topic('666 - created')

    room.say('666 - created')

    return room

  } catch (e) {
    log.error('Bot', 'getHelperContact() exception:', e.stack)
    throw e
  }
}