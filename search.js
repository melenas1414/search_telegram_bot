const api = require("./api");
const limit = 20;
const username = process.env.USERNAME;

/**
 * SEARCH In Telegram
 */
class SEARCH { 
    constructor() {
        this.inputPeer = {};
        this.inputchannel = {};
    }

    /**
     * Get Messages search from Channel or User
     * @param {string} search 
     * @returns array of messages
     */
    async search(search) {
        const resolvedPeer = await api.call('contacts.resolveUsername', {
            username: username,
        });
        const channel = resolvedPeer.chats.find(
            (chat) => chat.id === resolvedPeer.peer.channel_id
        );
        this.inputPeer = {
            _: 'inputPeerChannel',
            channel_id: resolvedPeer.chats[0].id,
            access_hash: resolvedPeer.chats[0].access_hash,
        };
        this.inputchannel = {
            _: 'inputChannel',
            channel_id: resolvedPeer.chats[0].id,
            access_hash: resolvedPeer.chats[0].access_hash,
        }
        var messages = [];
        var result = undefined;
        let params = 
            {
                peer: this.inputPeer,
                q: search,
                filter: {
                _: 'inputMessagesFilterEmpty',
                },
                flags: 10,
                limit: limit,
            };
        do {
            if (result !== undefined) {
                params.offset_id = result.messages[result.messages.length - 1].id;
            }   
            result = await api.call('messages.search', params);
            messages.push(...result.messages);
        } while (messages.length < result.count);

        return messages;
    }

    /**
     * 
     * GEt URL from Message
     * @param {object} message 
     * @returns string url
     */
    async getUrl(message) {
        let url = {};
        let params = {
            peer: this.inputPeer,
            grouped: 'true',
            thread: true,
            channel: this.inputchannel,
            id: message.id,
        }
        if(message.message === '') return undefined;
        if(message.media  === undefined) {
           params.id = message.id-1;
        } 
        try {
            url = await api.call('channels.exportMessageLink', params);
        } catch (err) {
        }
        return url.link;
    }
    /**
     * Get Stream File from Message
     * @param {object} message
     * @returns stream file
     * 
     */
    async getFileStream(message) {
        let messages = await this.getMessage(message);
        message = messages.messages[0];
        let inputPhotoFileLocation = {
            _: 'inputPhotoFileLocation',
            id: message.media.photo.id,
            access_hash: message.media.photo.access_hash,
            file_reference: message.media.photo.file_reference,
            thumb_size: 'y',
        };
        return api.call('upload.getFile', {location: inputPhotoFileLocation, cdn_supported: 1, limit: 1048576, offset: 0});
            
        
    }
    getMessage(message) {
        // Format inputMessageID
        let inputMessageID = {
          _: "inputMessageID",
          id: message.id,
        };
        let params = {
            channel: this.inputchannel,
            id: [inputMessageID],
        }
        return api.call('channels.getMessages', params);
    }
}

const search = new SEARCH();

module.exports = search;
