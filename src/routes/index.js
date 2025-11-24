import SignIn from "../pages/SignIn/SignIn";
import SignUp from "../pages/SignUp/SignUp";
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage";
import LudoHome from "../pages/LudoHome/LudoHome";
import WaitingRoom from "../pages/WaitingRoom/WaitingRoom";
import GamePlay from "../pages/GamePlay/GamePlay";
import Setting from "../pages/Setting/Setting";
import RoomPage from "../pages/RoomPage/RoomPage";
export const routes = [
    {
        path: '/signIn',
        page: SignIn,
        isShowHeader: true
    },
    {
        path: '/signUp',
        page: SignUp,
        isShowHeader: true
    },
    {
        path: 'ludohome',
        page: LudoHome,
        isShowHeader: true
    },
    {
        path: 'waiting',
        page: WaitingRoom,
        isShowHeader: true
    },
    {
        path: 'room',
        page: RoomPage,
        isShowHeader: true
    },
    {
        path: 'gameplay',
        page: GamePlay,
        isShowHeader: true
    },
    {
        path: 'setting',
        page: Setting,
        isShowHeader: true
    },
    {
        path: '*',
        page: NotFoundPage
    }
]