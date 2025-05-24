import { NextPage } from "next";

import About from "../components/About";
import MoreAbout from "../components/MoreAbout";
import PublicationList from "../components/PublicationList";
import News from "../components/News";
import Teaching from "../components/Teaching";
import Education from "../components/Education";

const Index: NextPage<unknown> = () => (
  <>
    <About />
    <MoreAbout />
    <News />
    <PublicationList />
    <Education />
  </>
);

export default Index;
