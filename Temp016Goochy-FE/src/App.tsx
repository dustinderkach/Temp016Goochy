import "./App.css";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useState } from "react";
import LoginComponent from "./components/LoginComponent";
import { AuthService } from "./services/AuthService";
import { DataService } from "./services/DataService";
import CreateTemp016Goochy from "./components/temp016Goochy/CreateTemp016Goochy";
import Temp016Goochy from "./components/temp016Goochy/Temp016Goochy";

const authService = new AuthService();
const dataService = new DataService(authService);

function App() {
	const [userName, setUserName] = useState<string | undefined>(undefined);

	const router = createBrowserRouter([
		{
			element: (
				<>
					<NavBar userName={userName} />
					<Outlet />
				</>
			),
			children: [
				{
					path: "/",
					element: <div>Hello world!</div>,
				},
				{
					path: "/login",
					element: (
						<LoginComponent
							authService={authService}
							setUserNameCb={setUserName}
						/>
					),
				},
				{
					path: "/profile",
					element: <div>Profile page</div>,
				},
				{
					path: "/createTemp016Goochy",
					element: <CreateTemp016Goochy dataService={dataService} />,
				},
				{
					path: "/temp016Goochy",
					element: <Temp016Goochy dataService={dataService} />,
				},
			],
		},
	]);

	return (
		<div className="wrapper">
			<RouterProvider router={router} />
		</div>
	);
}

export default App;
