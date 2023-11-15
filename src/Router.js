
import {
	createBrowserRouter,
	RouterProvider,
} from "react-router-dom";
import Splash from './Splash';
import Sandbox from './Sandbox';
import Docs from './Components/Docs/Docs';
import Catan from './Components/Catan/Catan';
import Test from "./test";
import CardView from './Views/CardsView';
import SceneView from "./Views/SceneView";
import CloudPlayer from "./Views/CloudPlayer/index";
import AuthSuccess from "./Views/CloudPlayer/AuthSuccess";

export default createBrowserRouter([
	{
		path: "/",
		element: <Splash />
	},
	{
		path: "/sandbox",
		element: <Sandbox />
	},
	{
		path: "/catan",
		element: <Catan />
	},
	{
		path: '/docs',
		element: <Docs />

	},
	{
		path: '/test',
		element: <Test />
	},
	{
		path: '/cards',
		element: <CardView />
	},
	{
		path: '/cloudShooter',
		element: <SceneView />
	},
	{
		path: '/cloudPlayer',
		element: <CloudPlayer />
	},
	{
		path: '/spotifyAuthSuccess',
		element: <AuthSuccess />
	}
]);