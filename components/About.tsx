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
            , where I am currently working under the supervision of Prof. Rahul
            Krishnan.
          </p>
          <p className="text-lg text-gray-700">
            {personalInfo.about.interest} <br />{" "}
          </p>
          <p className="text-base text-gray-500">
            I like to learn as broadly as possible. To me, knowledge isn't just
            in mastering a subject, but in discovering new perspectives.
            Learning isn't a hurdle — it's the whole point. If something is
            unfamiliar, that's an invitation to dive in. I'm open to all sorts
            of collaborations! ᴖᴥᴖ
          </p>
          <a className="text-sm">✉️ {personalInfo.about.email}</a>
          {/* <p className="text-sm text-gray-400">.. Last updated: Nov 21, 2024</p> */}
        </div>
      </div>
    </section>
  );
};

export default About;
