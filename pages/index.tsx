import { NextPage } from "next";

import About from "../components/About";
import VideoReel from "../components/VideoReel";
import MoreAbout from "../components/MoreAbout";
import Projects from "../components/Projects";
import PublicationList from "../components/PublicationList";
import News from "../components/News";

const Index: NextPage<unknown> = () => (
  <>
    <About />
    <VideoReel />
    <MoreAbout />
    <Projects />
    <PublicationList />
    <News />
  </>
);

export default Index;
