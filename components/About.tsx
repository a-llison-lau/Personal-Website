import Image from "next/image";

import ExtLink from "./ExtLink";
import ProfileImage from "./ProfileImage";
import SupportingBox from "./SupportingBox";
import personalInfo from "./data/personalInfo.json";

const About = (): JSX.Element => {
  return (
    <section className="grid gap-12" id="about">
      <div className="flex justify-between">
        <div className="mr-8 hidden md:flex flex-col items-center justify-center">
          <div className="flex justify-center w-full">
            <ProfileImage />
          </div>
          <div className="mt-8 flex justify-center w-full">
            <SupportingBox />
          </div>
        </div>
        <div className="flex flex-col max-w-xl w-full justify-evenly">
          <h1 className="text-4xl font-bold pb-10 md:pb-0">
            {personalInfo.name}
          </h1>
          <p>
            Hi! I am a {personalInfo.about.year} undergraduate student in
            computer science and physics at the{" "}
            <ExtLink href={personalInfo.about.college.link}>
              {personalInfo.about.college.name}
            </ExtLink>
            , under the mentorship of Prof. Rahul Krishnan.
          </p>
          <p className="text-lg text-gray-700">
            {personalInfo.about.interest} <br />{" "}
          </p>
          <p className="text-base text-gray-700">
            I seek to learn as broadly as possible — not just to master a
            subject, but to uncover new ways of seeing. I am an explorer at
            heart, driven by a curiosity to understand the world, humans,
            intelligent systems, and the relationship between the artificial and
            the natural. My work spans diverse research domains, including
            causal effect estimation and systems security in LLMs, computational
            sensing, and interdisciplinary science and instrumentation. I
            believe that computation should serve not just optimization, but
            meaning.
          </p>
          {/* <a className="text-sm">✉️ {personalInfo.about.email}</a> */}
          {/* <p className="text-sm text-gray-400">.. Last updated: Nov 21, 2024</p> */}
        </div>
      </div>
    </section>
  );
};

export default About;
