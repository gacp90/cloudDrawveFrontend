export class Template{
    constructor(
        public internalApiKey: string,
        public name: string,
        public language: string,
        public status: string,
        public category: string,
        public hasMedia: boolean,
        public headerType: string,
        public headerContent: string,
        public bodyText: string,
        public footerText: string,
        public buttons: any[],
        public headerVariablesMapping: any,
        public bodyVariablesMapping: any,
        public buttonVariablesMapping: any,
        public rawComponents: any,
        public active: boolean,
        public createdAt: Date,
        public upadtedAt: Date,
        public _id: string
    ){}
}