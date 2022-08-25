require('dotenv').config();
const api = require("./api");
const prompt = require('prompt');

const phone = process.env.PHONE;


/**
 * Get user info
 * @returns {Promise<void>}
 */
async function getUser() {
    try {
      const user = await api.call('users.getFullUser', {
        id: {
          _: 'inputUserSelf',
        },
      });
  
      return user;
    } catch (error) {
        console.log(error)
      return null;
    }
  }

/**
 *  Get phone code hash
 * @param {*} phone 
 * @returns {Promise<void>}
 */
function sendCode(phone) {
    return api.call('auth.sendCode', {
        phone_number: phone,
        settings: {
        _: 'codeSettings',
        },
    });
}

/**
 * RESEND CODE
 * @param {*} phone
 * @param {*} phone_code_hash
 * @returns {Promise<void>}
 */
function resendCode(phone, phone_code_hash) {
    return api.call('auth.resendCode', {
        phone_number: phone,
        phone_code_hash: phone_code_hash,
        settings: {
        _: 'codeSettings',
        },
    });
}

/**
 * 
 * Sign in Telegram
 * @param {*} code
 * @param {*} phone
 * @param {*} phone_code_hash
 * 
 * @returns {Promise<void>}
 */
function signIn({ code, phone, phone_code_hash }) {
    return api.call('auth.signIn', {
        phone_code: code,
        phone_number: phone,
        phone_code_hash: phone_code_hash,
    });
}

/**
 * 
 * Sing up Telegram
 * @param {*} phone
 * @param {*} phone_code_hash
 * 
 * @returns {Promise<void>}
 */
function signUp({ phone, phone_code_hash }) {
    return api.call('auth.signUp', {
      phone_number: phone,
      phone_code_hash: phone_code_hash,
      first_name: 'MTProto',
      last_name: 'Core',
    });
}

/**
 * Get Password Telegram
 * 
 * @returns {Promise<void>}
 */
function getPassword() {
    return api.call('account.getPassword');
}

/**
 * 
 * Check Password Telegram
 * @param {*} srp_id
 * @param {*} A
 * @param {*} M1
 * @returns {Promise<void>}
 */
function checkPassword({ srp_id, A, M1 }) {
    return api.call('auth.checkPassword', {
      password: {
        _: 'inputCheckPasswordSRP',
        srp_id,
        A,
        M1,
      },
    });
}


/**
 * 
 * Function Login Telegram
 * 
 */
(async () => {
    const user = await getUser();
  
    if (!user) {
        try {
           
            var { phone_code_hash } = await sendCode(phone);
            prompt.start();
            let result = await prompt.get(['Resend? Y/N']);
            while (result["Resend? Y/N"] ==='Y'){
                // awwait input code
               
                await resendCode(phone, phone_code_hash);
                recibe = await prompt.get(['Resend? Y/N']);
               
            } 
            
            const { code } = await prompt.get(['code']);
            
            const signInResult = await signIn({
            code,
            phone,
            phone_code_hash,
            });
    
            if (signInResult._ === 'auth.authorizationSignUpRequired') {
                await signUp({
                    phone,
                    phone_code_hash,
                });
            }
        } catch (error) {
            if (error.error_message !== 'SESSION_PASSWORD_NEEDED') {
                console.log(`error:`, error);
        
                return;
            }
    
            // 2FA
            const { password } = await prompt.get(['password']);
            
    
            const { srp_id, current_algo, srp_B } = await getPassword();
            const { g, p, salt1, salt2 } = current_algo;
    
            const { A, M1 } = await api.mtproto.crypto.getSRPParams({
            g,
            p,
            salt1,
            salt2,
            gB: srp_B,
            password,
            });
    
            const checkPasswordResult = await checkPassword({ srp_id, A, M1 });
            return true;
        }
        
    }
    return true;
})();