/* eslint-disable */

import React from 'react';
import './App.css';
import './Components/styles/dat.css';
import {
	createBrowserRouter,
	RouterProvider,
} from "react-router-dom";
import router from './Router';

const App = () => {

	const disconnectPlayer = () => {
		//@ts-ignore 
		if (window.spotifyPlayer) {
			console.log('attempting disconnect');
			//@ts-ignore
			window.spotifyPlayer.disconnect();
		}
	}

	React.useEffect(() => {
		window.addEventListener("loadstart", disconnectPlayer)
		window.addEventListener("beforeunload", disconnectPlayer);

		return () => {
			window.removeEventListener("loadstart", disconnectPlayer)
			window.removeEventListener("beforeunload", disconnectPlayer);
		}
	}, [])

	return (
		<RouterProvider router={router} />
	)
}

export default App;
