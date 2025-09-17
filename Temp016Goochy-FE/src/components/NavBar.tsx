import { NavLink } from "react-router-dom";

type NavBarProps = {
	userName: string | undefined;
};
export default function NavBar({ userName }: NavBarProps) {
	function renderLoginLogout() {
		if (userName) {
			return (
				<NavLink to="/logout" style={{ float: "right" }}>
					{userName}
				</NavLink>
			);
		} else {
			return (
				<NavLink to="/login" style={{ float: "right" }}>
					Login
				</NavLink>
			);
		}
	}

	return (
		<div className="navbar">
			<NavLink to={"/"}>Home</NavLink>
			<NavLink to={"/profile"}>Profile</NavLink>
			<NavLink to={"/temp016Goochy"}>Temp016Goochy</NavLink>
			<NavLink to={"/createTemp016Goochy"}>Create temp016Goochy</NavLink>
			{renderLoginLogout()}
		</div>
	);
}
