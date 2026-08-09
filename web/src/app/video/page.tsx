import VideoScreen from "@/components/video/VideoScreen";

/** Swap for the embed URL once the demo is uploaded. A `.mp4` under `public/`
 *  plays inline; a YouTube, Loom or Vimeo embed URL is rendered as a frame. */
const VIDEO_SRC = "/demo.mp4";

export const metadata = {
  title: "Liveboard — cómo funciona",
};

export default function VideoPage() {
  return <VideoScreen src={VIDEO_SRC} />;
}
