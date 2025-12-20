import { NextPage } from "next";

import About from "../components/About";
import PhotoGallery from "../components/PhotoGallery";
import MoreAbout from "../components/MoreAbout";
import Projects from "../components/Projects";
import PublicationList from "../components/PublicationList";
import News from "../components/News";

const Index: NextPage<unknown> = () => (
  <>
    <About />
    <PhotoGallery />
    <MoreAbout />
    <Projects />
    <PublicationList />
    <News />
  </>
);

export default Index;
