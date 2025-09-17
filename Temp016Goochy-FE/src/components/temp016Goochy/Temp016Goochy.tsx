import { useState, useEffect } from "react";
import Temp016GoochyComponent from "./Temp016GoochyComponent";
import { DataService } from "../../services/DataService";
import { NavLink } from "react-router-dom";
import { Temp016GoochyEntry } from "../model/model";

interface Temp016GoochyProps {
	dataService: DataService;
}

export default function Temp016Goochy(props: Temp016GoochyProps) {
	const [temp016Goochy, setTemp016Goochy] = useState<Temp016GoochyEntry[]>();
	const [reservationText, setReservationText] = useState<string>();

	useEffect(() => {
		const getTemp016Goochy = async () => {
			console.log("getting temp016Goochy....");
			const temp016Goochy = await props.dataService.getTemp016Goochy();
			setTemp016Goochy(temp016Goochy);
		};
		getTemp016Goochy();
	}, []); //Keep the array empty to run the effect only once (otherwise it will run on every render and cost $$)

	async function reserveTemp016Goochy(
		temp016GoochyId: string,
		temp016GoochyName: string
	) {
		const reservationResult = await props.dataService.reserveTemp016Goochy(
			temp016GoochyId
		);
		setReservationText(
			`You reserved ${temp016GoochyName}, reservation id: ${reservationResult}`
		);
	}

	function renderTemp016Goochy() {
		if (!props.dataService.isAuthorized()) {
			return <NavLink to={"/login"}>Please login</NavLink>;
		}
		const rows: any[] = [];
		if (temp016Goochy) {
			for (const temp016GoochyEntry of temp016Goochy) {
				rows.push(
					<Temp016GoochyComponent
						key={temp016GoochyEntry.id}
						id={temp016GoochyEntry.id}
						location={temp016GoochyEntry.location}
						name={temp016GoochyEntry.name}
						photoUrl={temp016GoochyEntry.photoUrl}
						reserveTemp016Goochy={reserveTemp016Goochy}
					/>
				);
			}
		}

		return rows;
	}

	return (
		<div>
			<h2>Welcome to the Temp016Goochy page!</h2>
			{reservationText ? <h2>{reservationText}</h2> : undefined}
			{renderTemp016Goochy()}
		</div>
	);
}
