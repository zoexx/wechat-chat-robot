/**
 * 更新/收集 通讯录数据
 * 
 */
import { writeFile } from 'fs'
import {
  Contact,
  log,
}           from 'wechaty'

export async function updateContactData() {
  log.info('Bot', 'get contact ...')
  const contactList = await Contact.findAll()

  log.info('Bot', 'Contact number: %d\n', contactList.length)
  log.info('Bot', 'I will save the contact info at ./data/contact.json')
  log.info('Bot', 'deal data ...')

  let contactDataList: any[] = []

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

export default updateContactData 