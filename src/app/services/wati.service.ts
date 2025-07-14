import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WatiService {

  constructor(  private http: HttpClient) { }

  /** ================================================================
   *  LOAD PLANTILLAS
  ==================================================================== */
  loadPlantilla(watitoken: string, watilink: string, pageSize: string = '10', pageNumber: string = '1'){

    const formdata = new FormData();
    formdata.append("pageSize", pageSize);
    formdata.append("pageNumber", pageNumber);

    return this.http.get<{ok: boolean, msg: string}>( `${watilink}/api/v1/getMessageTemplates`, {
      headers: {
        'Authorization': watitoken
      }
    });

  }

  /** ================================================================
   *  SEND MESSAGE
  ==================================================================== */
  sendMessage(watitoken: string, watilink: string, number: string, messageText: string){

    const formdata = new FormData();
    formdata.append("messageText", messageText);

    return this.http.post<{ok: boolean, msg: string}>( `${watilink}/api/v1/sendSessionMessage/${number}`, formdata, {
      headers: {
        'Authorization': watitoken
      }
    });
  }

  /** ================================================================
   *  SEND IMAGE
  ==================================================================== */
  sendImage(watitoken: string, watilink: string, number: string, img: any, caption: string = ''){

    const formData = new FormData();
    formData.append('file', img);
    formData.append('caption', caption);

    return this.http.post<{ok: boolean, msg: string}>( `${watilink}/api/v1/sendSessionFile/${number}`, formData, {
      headers: {
        'Authorization': watitoken
      }
    });
  }

  /** ================================================================
   *  SEND TEMPLATE MASIVE
  ==================================================================== */
  sendTemplateMasive(watitoken: string, watilink:string, body: any){

    return this.http.post<{ok: boolean, msg: string}>( `${watilink}/api/v1/sendTemplateMessages`, body, {
      headers: {
        'Authorization': watitoken
      }
    });
  }

}
