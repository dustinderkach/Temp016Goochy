import genericImage from "../../assets/generic-photo.jpg";
import { Temp015GoochyEntry } from "../model/model";
import "./Temp015GoochyComponent.css";

interface Temp015GoochyComponentProps extends Temp015GoochyEntry {
	reserveTemp015Goochy: (temp015GoochyId: string, temp015GoochyName: string) => void;
}

export default function Temp015GoochyComponent(props: Temp015GoochyComponentProps) {
	function renderImage() {
		if (props.photoUrl) {
			return <img src={props.photoUrl} />;
		} else {
			return <img src={genericImage} />;
		}
	}

	return (
		<div className="temp015GoochyComponent">
			{renderImage()}
			<label className="name">{props.name}</label>
			<br />
			<label className="location">{props.location}</label>
			<br />
			<button
				onClick={() => props.reserveTemp015Goochy(props.id, props.name)}
			>
				Reserve
			</button>
		</div>
	);
}
