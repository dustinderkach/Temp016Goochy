import { Temp016GoochyEntry } from "../model/Model";

export class MissingFieldError extends Error {
	constructor(missingField: string) {
		super(`Value for ${missingField} expected!`);
	}
}

export class JsonError extends Error {}

export function validateAsTemp016GoochyEntry(arg: any) {
	if ((arg as Temp016GoochyEntry).location == undefined) {
		throw new MissingFieldError("location");
	}
	if ((arg as Temp016GoochyEntry).name == undefined) {
		throw new MissingFieldError("name");
	}
	if ((arg as Temp016GoochyEntry).id == undefined) {
		throw new MissingFieldError("id");
	}
}
