import "./App.css";
import Game from "./game/Game";
import Topbar from './Topbar.tsx';
import Sidebar from "./Sidebar";
// import { useItemStore } from "./itemStore.tsx";
import { useHashStore } from "./hashStore.tsx";
import { useEffect } from 'react';
import Profile from "./Profile.tsx";
import { Chat } from "./Chat.tsx";


function App() {
	// const { showItem } = useItemStore();
	const { showHash } = useHashStore();
	useEffect(() => {

		const handleHashChange = () => {
			const hash = window.location.hash;
			useHashStore.getState().togglehash(hash);
		}
		window.addEventListener('hashchange', handleHashChange);

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
		}
	}, []);

	
  return (
	<div>
		<Sidebar/>
		<Topbar />
			{showHash === '#Game' && (
			<div className="game">
				<Game width={800} height={500} againstAi={true}/>
			</div>)
			}
			{showHash === '#Profile' && (
			<div className="game">
				<Profile/>
			</div>)
			}
			{showHash === '#Chat' && (
			<div className="game">
				<Chat/>
			</div>)
			}
	</div>
	);
}

export default App;
