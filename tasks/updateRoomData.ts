/**
 * 更新/收集 通讯录数据
 * 
 */
import { writeFile } from 'fs'
import {
  Contact,
  Room,
  log,
}           from 'wechaty'

export async function updateRoomData() {
  log.info('Bot', 'get room ...')
  const roomList = await Room.findAll()

  log.info('Bot', 'room number: %d\n', roomList.length)
  log.info('Bot', 'I will save the room info at ./data/room.json')
  log.info('Bot', 'deal data ...')

  let roomDataList: any[] = []

  for (let i = 0; i < roomList.length; i++) {
    const contact = roomList[i]

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

    roomDataList.push(contactData)
  }


  writeFile( './data/contact.json' , JSON.stringify( roomDataList ) , 'utf8' , function(err){
    if (err) throw err
    console.log('The file has been saved!')
  })

}