import axios from 'axios';
import EventSource from "react-native-sse";
import uuid from 'react-native-uuid';

export class RealtimeDatabaseMobileClient {
    referances = [];
    url = 'http://192.168.1.104:8000/api/realtime/';
    constructor(url) {
        if (url) {
            this.url = url;
        }
    }

    ref(ref) {
        if (this.referances.find(r => r.ref == ref)) {
            return this.referances.find(r => r.ref == ref);
        }
        const r = new RealtimeDatabaseMobileReferance(ref, this.url);
        this.referances.push(r);
        return r;
    }
    close() {
        this.referances.forEach(ref => {
            ref.close();
        })
    }
}

class RealtimeDatabaseMobileReferance {
    url = 'http://192.168.1.104:8000/api/realtime/';
    constructor(ref, url) {
        this.ref = ref;
        if (url) {
            this.url = url;
        }
    }
    sse = {}
    session_id = null;
    listen(callback) {
        this.session_id = uuid.v4()
        const sse = new EventSource(this.url + 'listen?id=' + this.session_id)
        this.sse = sse;
        sse.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            let r1 = this.ref
            if (r1 == '*') {
                callback(null, data);
            } else if (r1.indexOf('.') > -1) {
                let data2 = r1.split('.').reduce((o, i) => o[i], data);
                callback(null, data2);
            }
            else if (data[r1]) {
                callback(null, data[r1]);
            }
        })
        sse.addEventListener('error', (error) => {
            sse.close();
            callback(error, null);
        })
        sse.addEventListener('open', (event) => {
        })
        sse.addEventListener('close', (event) => {
        })
    }



    close() {
        axios.post(this.url + 'stop', { id: this.session_id })
        this.sse.removeAllListeners();
        this.sse.close()
    }


    push(data) {
        return axios.post(this.url + 'put', { ref: this.ref, data: data });
    }
}