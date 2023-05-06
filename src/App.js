/* eslint-disable */

import React from 'react';
import './App.css';
import './Components/styles/dat.css';
import {
	createBrowserRouter,
	RouterProvider,
} from "react-router-dom";
import Splash from './Components/Splash';
import Sandbox from './Components/Sandbox';
import Docs from './Components/Docs/Docs';

const router = createBrowserRouter([
	{
		path: "/",
		element: <Splash />
	},
	{
		path: "/sandbox",
		element: <Sandbox />
	},
	{
		path: '/docs',
		element: <Docs />

	}
]);

class App extends React.Component {
	render() {
		return (
			<RouterProvider router={router} />
		)
	}
}

export default App;
