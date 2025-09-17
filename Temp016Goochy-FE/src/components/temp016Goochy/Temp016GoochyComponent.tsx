import genericImage from "../../assets/generic-photo.jpg";
import { Temp016GoochyEntry } from "../model/model";
import "./Temp016GoochyComponent.css";

interface Temp016GoochyComponentProps extends Temp016GoochyEntry {
	reserveTemp016Goochy: (temp016GoochyId: string, temp016GoochyName: string) => void;
}

export default function Temp016GoochyComponent(props: Temp016GoochyComponentProps) {
	function renderImage() {
		if (props.photoUrl) {
			return <img src={props.photoUrl} />;
		} else {
			return <img src={genericImage} />;
		}
	}

	return (
		<div className="temp016GoochyComponent">
			{renderImage()}
			<label className="name">{props.name}</label>
			<br />
			<label className="location">{props.location}</label>
			<br />
			<button
				onClick={() => props.reserveTemp016Goochy(props.id, props.name)}
			>
				Reserve
			</button>
		</div>
	);
}
