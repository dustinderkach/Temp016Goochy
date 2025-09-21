import { AppModelEntry } from "../model/Model";

export class MissingFieldError extends Error {
	constructor(missingField: string) {
		super(`Value for ${missingField} expected!`);
	}
}

export class JsonError extends Error {}

export function validateAsAppThingEntry(arg: any) {
	if ((arg as AppModelEntry).location == undefined) {
		throw new MissingFieldError("location");
	}
	if ((arg as AppModelEntry).name == undefined) {
		throw new MissingFieldError("name");
	}
	if ((arg as AppModelEntry).id == undefined) {
		throw new MissingFieldError("id");
	}
}
