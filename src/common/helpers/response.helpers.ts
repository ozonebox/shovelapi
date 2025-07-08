// src/common/helpers/http-response.helper.ts


interface ResponseOptions {
  responsecode: string;
  responsemessage: string;
  data?: any;
  success?: boolean;
  [key: string]: any; // for extra fields like token, meta, etc.
}

interface ResponseJsonOptions {
  responsecode: string;
  responsemessage: string;
  data?: any;
  success?: boolean;
  [key: string]: any; // for extra fields like token, meta, etc.
}

export function sendResponse(options: ResponseOptions) {
  const {
    responsecode,
    responsemessage,
    data = null,
    ...extraFields
  } = options;

  const payload: Record<string, any> = {
    responsecode,
    responsemessage
  };

  if (data !== null) {
    payload.data = data;
  }

  // Add any additional custom fields (e.g., token, meta)
  Object.assign(payload, extraFields);
  return payload;
  //return res.status(statusCode).json(payload);
}

export function sendResponseJson(options: ResponseJsonOptions) {
  const {
    responsecode,
    responsemessage,
    data = null,
    ...extraFields
  } = options;

  const payload: Record<string, any> = {
    responsecode,
    responsemessage
  };

  if (data !== null) {
    payload.data = data;
  }

  // Add any additional custom fields (e.g., token, meta)
  Object.assign(payload, extraFields);

  return payload;
}
