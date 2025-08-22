// email regEx
const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

//name regEx
const nameRegEx = /^[a-zA-Z ]{2,40}$/;

//Password regEx
const passWordRegEx = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

// regex for atm card number
const atmCardNumberRegex = /^[0-9]{16}$/;

// cvv regEx
const CvvRegEx = /^[0-9]{3,4}$/;

//Email validation
const validateEmail = email => {
  if (!email) {
    return {
      status: false,
      msg: strings.thisFieldIsMandatory,
    };
  } else {
    return emailRegEx.test(email)
      ? {status: true, msg: ''}
      : {
          status: false,
          msg: strings.enterValidEmail,
        };
  }
};

// name Validation
const validName = name => {
  if (!name) {
    return {
      status: false,
      msg: strings.thisFieldIsMandatory,
    };
  } else {
    return nameRegEx.test(name)
      ? {status: true, msg: ''}
      : {
          status: false,
          msg: strings.enterValidName,
        };
  }
};

// password validation
const validPassword = (pass, isConfrimPass, password) => {
  if (!pass) {
    return {
      status: false,
      msg: strings.plsEnterPassword,
    };
  } else if (pass.length < 8) {
    return {
      status: false,
      msg: strings.validatePassword,
    };
  } else {
    if (passWordRegEx.test(pass)) {
      if (isConfrimPass && password != pass) {
        return {
          status: false,
          msg: strings.confirmPassValidString,
        };
      }
      return {status: true, msg: ''};
    } else {
      return {
        status: false,
        msg: strings.validatePassword,
      };
    }
  }
};
// confirm password validation
const validateConfirmPassword = (pass, password) => {
  if (!pass) {
    return {
      status: false,
      msg: strings.plsEnterPassword,
    };
  } else if (pass.length < 8) {
    return {
      status: false,
      msg: strings.validatePassword,
    };
  } else {
    if (passWordRegEx.test(pass)) {
      if (password != pass) {
        return {
          status: false,
          msg: strings.confirmPassValidString,
        };
      }
      return {status: true, msg: ''};
    } else {
      return {
        status: false,
        msg: strings.validatePassword,
      };
    }
  }
};

// cvv validation
const validateCvv = cvv => {
  if (!cvv) {
    return {
      status: false,
      msg: strings.thisFieldIsMandatory,
    };
  } else {
    return CvvRegEx.test(cvv)
      ? {status: true, msg: ''}
      : {
          status: false,
          msg: strings.validCvv,
        };
  }
};

// ATM card number validation
const validateCardNumber = atmCardNumber => {
  if (!atmCardNumber) {
    return {
      status: false,
      msg: strings.thisFieldIsMandatory,
    };
  } else {
    return atmCardNumberRegex.test(atmCardNumber)
      ? {status: true, msg: ''}
      : {
          status: false,
          msg: strings.validCardNumber,
        };
  }
};
export {
  validateEmail,
  validName,
  validPassword,
  validateCvv,
  validateCardNumber,
  validateConfirmPassword,
};
