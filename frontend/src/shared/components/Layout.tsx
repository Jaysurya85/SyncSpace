import { Outlet } from "react-router-dom";

const Layout = () => {
	return (
		<div>
			<nav>Navbar Placeholder</nav>
			<main>
				<Outlet />
			</main>
		</div>
	);
};

export default Layout;

