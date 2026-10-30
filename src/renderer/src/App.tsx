import { AmbientBackground } from './components/AmbientBackground'
import { Titlebar } from './components/ui/Titlebar'
import { ToastProvider } from './components/ui/Toast'
import { Gallery } from './screens/Gallery'

function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <div className="relative flex h-full flex-col overflow-hidden">
        <AmbientBackground mode="panels" />
        <Titlebar />
        <main className="relative min-h-0 flex-1">
          <Gallery />
        </main>
      </div>
    </ToastProvider>
  )
}

export default App
