import nil from "./nil.js"

function randomString(length: number): string {
  let result: string = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let index = 0; index < length; index++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

class FormDataBuilder {
  boundary;
  formdata = [];
  newline = "\n";

  constructor(rn: boolean, boundry: nil<string>) {
    this.newline = rn === true ? "\r\n" : "\n";
    if (boundry == undefined)
      this.boundary = `------WebKitFormBoundary${randomString(16)}`;
    else this.boundary = boundry;
  }

  appendField(name: string, mimetype: string, content: string) {
    this.formdata.push(
      `Content-Disposition: form-data; name="${name}"; filename="blob"${this.newline}Content-Type: ${mimetype}${this.newline}${this.newline}${content}`
    );
  }

  getString(): string {
    return `${this.boundary}${this.newline}${this.formdata.join(
      this.newline + this.boundary + this.newline
    )}${this.newline}${this.boundary}--`;
  }

  getMimeType(): string {
    return `multipart/form-data; boundary=${this.boundary}`;
  }
}

export default FormDataBuilder;
