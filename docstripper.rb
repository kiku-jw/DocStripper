# Homebrew formula for DocStripper
# To install: brew install --build-from-source docstripper.rb
# Or add this tap first: brew tap kiku-jw/docstripper

class Docstripper < Formula
  desc "AI-powered batch document cleaner - Remove noise from text documents automatically"
  homepage "https://github.com/kiku-jw/DocStripper"
  url "https://github.com/kiku-jw/DocStripper/archive/refs/heads/main.zip"
  version "2.1.0"
  sha256 "" # Will be calculated on first release
  license "MIT"

  depends_on "python@3.9"

  def install
    # Install the tool as a Python script
    bin.install "tool.py" => "docstripper"
    # Make it executable
    chmod 0755, bin/"docstripper"
  end

  test do
    # Run self-test
    system "#{bin}/docstripper", "--help"
    system "python3", "#{Formula["python@3.9"].opt_bin}/python3", "-c", "import sys; sys.path.insert(0, '#{share}/docstripper'); from tool import DocStripper; print('OK')" if File.exist?("#{share}/docstripper/tool.py")
  end
end
