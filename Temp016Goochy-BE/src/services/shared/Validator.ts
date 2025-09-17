import { AppEntry } from "../model/Model";

export class MissingFieldError extends Error {
	constructor(missingField: string) {
		super(`Value for ${missingField} expected!`);
	}
}

export class JsonError extends Error {}

export function validateAsAppEntry(arg: any) {
	if ((arg as AppEntry).location == undefined) {
		throw new MissingFieldError("location");
	}
	if ((arg as AppEntry).name == undefined) {
		throw new MissingFieldError("name");
	}
	if ((arg as AppEntry).id == undefined) {
		throw new MissingFieldError("id");
	}
}
