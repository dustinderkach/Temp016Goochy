import { useState, useEffect } from "react";
import AppThingComponent from "./AppThingComponent";
import { DataService } from "../../services/DataService";
import { NavLink } from "react-router-dom";
import { AppThingEntry } from "../model/model";

interface AppThingProps {
	dataService: DataService;
}

export default function AppThing(props: AppThingProps) {
	const [appThing, setAppThing] = useState<AppThingEntry[]>();
	const [reservationText, setReservationText] = useState<string>();

	useEffect(() => {
		const getAppThing = async () => {
			console.log("getting the app thing....");
			const appThing = await props.dataService.getAppThing();
			setAppThing(appThing);
		};
		getAppThing();
	}, []); //Keep the array empty to run the effect only once (otherwise it will run on every render and cost $$)

	async function reserveAppThing(appThingId: string, appThingName: string) {
		const reservationResult = await props.dataService.reserveAppThing(
			appThingId
		);
		setReservationText(
			`You reserved ${appThingName}, reservation id: ${reservationResult}`
		);
	}

	function renderAppThing() {
		if (!props.dataService.isAuthorized()) {
			return <NavLink to={"/login"}>Please login</NavLink>;
		}
		const rows: any[] = [];
		if (appThing) {
			for (const appThingEntry of appThing) {
				rows.push(
					<AppThingComponent
						key={appThingEntry.id}
						id={appThingEntry.id}
						location={appThingEntry.location}
						name={appThingEntry.name}
						photoUrl={appThingEntry.photoUrl}
						reserveAppThing={reserveAppThing}
					/>
				);
			}
		}

		return rows;
	}

	return (
		<div>
			<h2>Welcome to the app thing page!</h2>
			{reservationText ? <h2>{reservationText}</h2> : undefined}
			{renderAppThing()}
		</div>
	);
}
