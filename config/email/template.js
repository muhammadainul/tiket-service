const moment = require('moment');

function Notification (mailNotes, uploadQr, template, template_footer) {
    return {
        html: `
        <div style="max-width:600px;width:100%;margin-left:auto;margin-right:auto;background-color:#fff">
            <div class="m_-3317261492876250685body-padding">
                <span class="im">
                    <div>
                        <p style="font-size:20px;font-weight:600;line-height:29px;color:#1f2d3d">
                        Hai ${mailNotes.nama_lengkap}!<br> ${template}
                        </p>
                    </div>        
                </span>
                <div style="max-width:385px;border-radius:8px;border-color:#dde2e8;border-width:1px;border-style:solid;padding-top:14px;padding-bottom:15">
                    <table border="0" style="width:100%">
                        <tbody>
                            <tr>
                                <td colspan="2" style="border-bottom:1px solid #dde2e8;padding-bottom:16px;padding-left:14px;padding-right:14px">
                                    <p style="font-size:13px;margin:0px;padding:0px;line-height:24px;color:#6a7481">
                                        No.Tiket
                                    </p>
                                    <p style="font-weight:600;font-size:16px;margin:0px;padding:0px;line-height:24px">
                                        ${mailNotes.no_tiket}
                                    </p>
                                    <br>
                                    <p style="font-size:13px;margin:0px;padding:0px;line-height:24px;color:#6a7481">
                                        Tanggal Tiket
                                    </p>
                                    <p style="font-weight:600;font-size:16px;margin:0px;padding:0px;line-height:24px">
                                        ${moment(mailNotes.tanggal_tiket).locale('id').format('D MMMM YYYY, HH:mm:ss')}
                                    </p>
                                    <br>
                                    <p style="font-size:13px;margin:0px;padding:0px;line-height:24px;color:#6a7481">
                                        Pertanyaan
                                    </p>
                                    <p style="font-weight:600;font-size:16px;margin:0px;padding:0px;line-height:24px">
                                        ${mailNotes.detail}
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="width:50%;padding-left:14px;padding-right:14px">
                                <p style="font-size:16px;font-weight:600">QR Code</p>
                                <p><img src="${config.myConfig.destination_image}${uploadQr.filename}" width="200px"/></p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <span class="im">        
                    <p style="font-size:16px;color:#6a7481;margin-top:24px;margin-bottom:0">
                    ${template_footer} <img data-emoji="❤" class="an1" alt="❤" aria-label="❤" src="https://fonts.gstatic.com/s/e/notoemoji/14.0/2764/72.png" width="20" loading="lazy">
                    </p>
                    <span style="font-size:15px;color:#6a7481">Email ini dibuat secara otomatis, Mohon tidak mengirimkan balasan ke email ini.</span>
                    <p style="font-size:16px;color:#6a7481;margin-top:50px;margin-bottom:5px">Salam,</p>
                    <p style="font-size:16px;font-weight:bold;margin-top:0;margin-bottom:0">Simandesk Support</p>
                    <div class="yj6qo ajU">
                        <div id=":q0" class="ajR" role="button" tabindex="0" aria-label="Sembunyikan konten yang diperluas" aria-expanded="true" data-tooltip="Sembunyikan konten yang diperluas">
                            <img class="ajT" src="//ssl.gstatic.com/ui/v1/icons/mail/images/cleardot.gif">
                        </div>
                    </div>
                    <div class="adL">
                        
                    </div>
                </span>
            </div>
        </div>`
    };
}

module.exports = {
    Notification
}