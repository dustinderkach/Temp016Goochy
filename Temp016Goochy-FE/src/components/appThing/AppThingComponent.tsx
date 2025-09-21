import genericImage from "../../assets/generic-photo.jpg";
import { AppThingEntry } from "../model/model";
import "./Temp016GoochyComponent.css";

interface AppThingComponentProps extends AppThingEntry {
	reserveAppThing: (
		appThingId: string,
		appThingName: string
	) => void;
}

export default function AppThingComponent(props: AppThingComponentProps) {
	function renderImage() {
		if (props.photoUrl) {
			return <img src={props.photoUrl} />;
		} else {
			return <img src={genericImage} />;
		}
	}

	return (
		<div className="appThingComponent">
			{renderImage()}
			<label className="name">{props.name}</label>
			<br />
			<label className="location">{props.location}</label>
			<br />
			<button onClick={() => props.reserveAppThing(props.id, props.name)}>
				Reserve
			</button>
		</div>
	);
}
