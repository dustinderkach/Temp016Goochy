import { useState, useEffect } from "react";
import Temp015GoochyComponent from "./Temp015GoochyComponent";
import { DataService } from "../../services/DataService";
import { NavLink } from "react-router-dom";
import { Temp015GoochyEntry } from "../model/model";

interface Temp015GoochyProps {
	dataService: DataService;
}

export default function Temp015Goochy(props: Temp015GoochyProps) {
	const [temp015Goochy, setTemp015Goochy] = useState<Temp015GoochyEntry[]>();
	const [reservationText, setReservationText] = useState<string>();

	useEffect(() => {
		const getTemp015Goochy = async () => {
			console.log("getting temp015Goochy....");
			const temp015Goochy = await props.dataService.getTemp015Goochy();
			setTemp015Goochy(temp015Goochy);
		};
		getTemp015Goochy();
	}, []); //Keep the array empty to run the effect only once (otherwise it will run on every render and cost $$)

	async function reserveTemp015Goochy(
		temp015GoochyId: string,
		temp015GoochyName: string
	) {
		const reservationResult = await props.dataService.reserveTemp015Goochy(
			temp015GoochyId
		);
		setReservationText(
			`You reserved ${temp015GoochyName}, reservation id: ${reservationResult}`
		);
	}

	function renderTemp015Goochy() {
		if (!props.dataService.isAuthorized()) {
			return <NavLink to={"/login"}>Please login</NavLink>;
		}
		const rows: any[] = [];
		if (temp015Goochy) {
			for (const temp015GoochyEntry of temp015Goochy) {
				rows.push(
					<Temp015GoochyComponent
						key={temp015GoochyEntry.id}
						id={temp015GoochyEntry.id}
						location={temp015GoochyEntry.location}
						name={temp015GoochyEntry.name}
						photoUrl={temp015GoochyEntry.photoUrl}
						reserveTemp015Goochy={reserveTemp015Goochy}
					/>
				);
			}
		}

		return rows;
	}

	return (
		<div>
			<h2>Welcome to the Temp015Goochy page!</h2>
			{reservationText ? <h2>{reservationText}</h2> : undefined}
			{renderTemp015Goochy()}
		</div>
	);
}
